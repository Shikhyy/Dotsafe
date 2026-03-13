import { expect } from "chai";
import { ethers } from "hardhat";
import { XCMGuard } from "../typechain-types";

describe("XCMGuard", function () {
  let xcmGuard: XCMGuard;
  let owner: any;
  let operator: any;
  let other: any;

  beforeEach(async function () {
    [owner, operator, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("XCMGuard");
    xcmGuard = await Factory.deploy();
  });

  describe("constructor", function () {
    it("should initialize with 3 monitored parachains", async function () {
      const count = await xcmGuard.getMonitoredCount();
      expect(count).to.equal(3);
    });

    it("should contain Moonbeam, Astar, and Acala", async function () {
      const chains = await xcmGuard.getMonitoredParachains();
      expect(chains.map(Number)).to.deep.equal([2004, 2006, 2000]);
    });

    it("should report Moonbeam as monitored", async function () {
      expect(await xcmGuard.isMonitored(2004)).to.be.true;
    });

    it("should report unknown chain as not monitored", async function () {
      expect(await xcmGuard.isMonitored(9999)).to.be.false;
    });
  });

  describe("AccessControl (OpenZeppelin)", function () {
    it("deployer has DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await xcmGuard.DEFAULT_ADMIN_ROLE();
      expect(await xcmGuard.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("deployer has OPERATOR_ROLE", async function () {
      const operatorRole = await xcmGuard.OPERATOR_ROLE();
      expect(await xcmGuard.hasRole(operatorRole, owner.address)).to.be.true;
    });

    it("deployer has GUARDIAN_ROLE", async function () {
      const guardianRole = await xcmGuard.GUARDIAN_ROLE();
      expect(await xcmGuard.hasRole(guardianRole, owner.address)).to.be.true;
    });

    it("non-operator cannot send alert", async function () {
      await expect(
        xcmGuard.connect(other).sendRiskAlert(2004, ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "AccessControlUnauthorizedAccount");
    });

    it("admin can grant OPERATOR_ROLE", async function () {
      const operatorRole = await xcmGuard.OPERATOR_ROLE();
      await xcmGuard.grantRole(operatorRole, operator.address);
      expect(await xcmGuard.hasRole(operatorRole, operator.address)).to.be.true;
    });
  });

  describe("Parachain management", function () {
    it("guardian can add a new parachain", async function () {
      await xcmGuard.addParachain(3000);
      expect(await xcmGuard.isMonitored(3000)).to.be.true;
      expect(await xcmGuard.getMonitoredCount()).to.equal(4);
    });

    it("cannot add already monitored parachain", async function () {
      await expect(xcmGuard.addParachain(2004))
        .to.be.revertedWithCustomError(xcmGuard, "ParachainAlreadyMonitored");
    });

    it("guardian can remove a parachain", async function () {
      await xcmGuard.removeParachain(2006);
      expect(await xcmGuard.isMonitored(2006)).to.be.false;
      expect(await xcmGuard.getMonitoredCount()).to.equal(2);
    });

    it("cannot remove unmonitored parachain", async function () {
      await expect(xcmGuard.removeParachain(9999))
        .to.be.revertedWithCustomError(xcmGuard, "ParachainNotMonitored");
    });

    it("non-guardian cannot add parachain", async function () {
      await expect(
        xcmGuard.connect(other).addParachain(3000)
      ).to.be.revertedWithCustomError(xcmGuard, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable (OpenZeppelin)", function () {
    it("guardian can pause and unpause", async function () {
      await xcmGuard.pause();
      // sendRiskAlert should revert when paused (even for valid operator call,
      // the XCM precompile won't exist in tests, but pause check comes first)
      await expect(
        xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "EnforcedPause");

      await xcmGuard.unpause();
    });

    it("non-guardian cannot pause", async function () {
      await expect(
        xcmGuard.connect(other).pause()
      ).to.be.revertedWithCustomError(xcmGuard, "AccessControlUnauthorizedAccount");
    });
  });

  describe("constants", function () {
    it("should have correct parachain IDs", async function () {
      expect(await xcmGuard.MOONBEAM_PARA_ID()).to.equal(2004);
      expect(await xcmGuard.ASTAR_PARA_ID()).to.equal(2006);
      expect(await xcmGuard.ACALA_PARA_ID()).to.equal(2000);
    });
  });

  describe("sendRiskAlert", function () {
    it("operator can send alert with empty payload (best-effort XCM)", async function () {
      await xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, "0x");
      expect(await xcmGuard.alertCount(2004)).to.equal(1);
      expect(await xcmGuard.totalAlerts()).to.equal(1);
    });

    it("alert increments only the target parachain counter", async function () {
      await xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, "0x");
      await xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, "0x");
      await xcmGuard.sendRiskAlert(2006, ethers.ZeroAddress, "0x");
      expect(await xcmGuard.alertCount(2004)).to.equal(2);
      expect(await xcmGuard.alertCount(2006)).to.equal(1);
      expect(await xcmGuard.alertCount(2000)).to.equal(0);
      expect(await xcmGuard.totalAlerts()).to.equal(3);
    });

    it("emits CrossChainAlertSent event", async function () {
      const suspiciousAddr = ethers.Wallet.createRandom().address;
      await expect(xcmGuard.sendRiskAlert(2004, suspiciousAddr, "0x"))
        .to.emit(xcmGuard, "CrossChainAlertSent")
        .withArgs(2004, suspiciousAddr, owner.address);
    });

    it("reverts on unmonitored parachain", async function () {
      await expect(
        xcmGuard.sendRiskAlert(9999, ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "ParachainNotMonitored");
    });

    it("non-operator cannot send alert", async function () {
      await expect(
        xcmGuard.connect(other).sendRiskAlert(2004, ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "AccessControlUnauthorizedAccount");
    });

    it("does not revert with non-empty XCM payload (best-effort — no precompile in test env)", async function () {
      const dummyPayload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint32", "address"], [2004, ethers.ZeroAddress]
      );
      // Call should succeed even though the XCM precompile doesn't exist in Hardhat
      await xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, dummyPayload);
      expect(await xcmGuard.alertCount(2004)).to.equal(1);
    });

    it("reverts when paused", async function () {
      await xcmGuard.pause();
      await expect(
        xcmGuard.sendRiskAlert(2004, ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "EnforcedPause");
    });
  });

  describe("requestCrossChainScan", function () {
    it("operator can request a scan with empty payload", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      await xcmGuard.requestCrossChainScan(2004, wallet, "0x");
      // No counter is incremented by requestCrossChainScan — only event is emitted
    });

    it("emits CrossChainScanRequested event", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      await expect(xcmGuard.requestCrossChainScan(2004, wallet, "0x"))
        .to.emit(xcmGuard, "CrossChainScanRequested")
        .withArgs(2004, wallet, owner.address);
    });

    it("reverts on unmonitored parachain", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      await expect(
        xcmGuard.requestCrossChainScan(9999, wallet, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "ParachainNotMonitored");
    });

    it("non-operator cannot request scan", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      await expect(
        xcmGuard.connect(other).requestCrossChainScan(2004, wallet, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "AccessControlUnauthorizedAccount");
    });

    it("does not revert with non-empty XCM payload (best-effort)", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      const dummyPayload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint32", "address"], [2004, wallet]
      );
      await xcmGuard.requestCrossChainScan(2004, wallet, dummyPayload);
    });

    it("reverts when paused", async function () {
      const wallet = ethers.Wallet.createRandom().address;
      await xcmGuard.pause();
      await expect(
        xcmGuard.requestCrossChainScan(2004, wallet, "0x")
      ).to.be.revertedWithCustomError(xcmGuard, "EnforcedPause");
    });

    it("granted operator can request scan", async function () {
      const operatorRole = await xcmGuard.OPERATOR_ROLE();
      await xcmGuard.grantRole(operatorRole, operator.address);
      const wallet = ethers.Wallet.createRandom().address;
      await expect(
        xcmGuard.connect(operator).requestCrossChainScan(2006, wallet, "0x")
      ).to.emit(xcmGuard, "CrossChainScanRequested");
    });
  });
});
