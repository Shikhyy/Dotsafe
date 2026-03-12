import { expect } from "chai";
import { ethers } from "hardhat";
import { XCMGuard } from "../typechain-types";

describe("XCMGuard", function () {
  let xcmGuard: XCMGuard;

  beforeEach(async function () {
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

  describe("sendRiskAlert", function () {
    it("should revert for unmonitored parachain", async function () {
      await expect(
        xcmGuard.sendRiskAlert(9999, ethers.ZeroAddress, "0x")
      ).to.be.revertedWith("Parachain not monitored");
    });
  });

  describe("requestCrossChainScan", function () {
    it("should revert for unmonitored parachain", async function () {
      await expect(
        xcmGuard.requestCrossChainScan(9999, ethers.ZeroAddress, "0x")
      ).to.be.revertedWith("Parachain not monitored");
    });
  });

  describe("constants", function () {
    it("should have correct parachain IDs", async function () {
      expect(await xcmGuard.MOONBEAM_PARA_ID()).to.equal(2004);
      expect(await xcmGuard.ASTAR_PARA_ID()).to.equal(2006);
      expect(await xcmGuard.ACALA_PARA_ID()).to.equal(2000);
    });
  });
});
