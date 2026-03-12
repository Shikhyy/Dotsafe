import { expect } from "chai";
import { ethers } from "hardhat";
import { ApprovalPolicy, MockERC20 } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("ApprovalPolicy", function () {
  let policy: ApprovalPolicy;
  let tokenA: MockERC20;
  let owner: any;
  let spenderA: any;
  let spenderB: any;
  let other: any;

  beforeEach(async function () {
    [owner, spenderA, spenderB, other] = await ethers.getSigners();

    const PolicyFactory = await ethers.getContractFactory("ApprovalPolicy");
    policy = await PolicyFactory.deploy();

    const MockFactory = await ethers.getContractFactory("MockERC20");
    tokenA = await MockFactory.deploy("Token A", "TKA");
  });

  describe("Wallet Registration", function () {
    it("should register a wallet", async function () {
      await expect(policy.registerWallet())
        .to.emit(policy, "WalletRegistered")
        .withArgs(owner.address);
      expect(await policy.isRegistered(owner.address)).to.be.true;
      expect(await policy.registeredWalletCount()).to.equal(1);
    });

    it("should revert on double registration", async function () {
      await policy.registerWallet();
      await expect(policy.registerWallet())
        .to.be.revertedWithCustomError(policy, "AlreadyRegistered");
    });
  });

  describe("Token Policy Management", function () {
    it("should set a token policy", async function () {
      const tokenAddr = await tokenA.getAddress();
      const maxAllowance = ethers.parseEther("1000");
      const window = 86400; // 1 day

      await expect(policy.setTokenPolicy(tokenAddr, maxAllowance, window, false))
        .to.emit(policy, "PolicySet")
        .withArgs(owner.address, tokenAddr, maxAllowance, window);

      const p = await policy.tokenPolicies(owner.address, tokenAddr);
      expect(p.maxAllowance).to.equal(maxAllowance);
      expect(p.approvalWindow).to.equal(window);
      expect(p.whitelistOnly).to.be.false;
      expect(p.active).to.be.true;
    });

    it("should remove a token policy", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, ethers.parseEther("100"), 0, false);
      await expect(policy.removeTokenPolicy(tokenAddr))
        .to.emit(policy, "PolicyRemoved")
        .withArgs(owner.address, tokenAddr);

      const p = await policy.tokenPolicies(owner.address, tokenAddr);
      expect(p.active).to.be.false;
    });

    it("should increment totalPoliciesCreated", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, 0, 0, false);
      expect(await policy.totalPoliciesCreated()).to.equal(1);
    });
  });

  describe("Whitelist Management", function () {
    it("should add and check whitelist", async function () {
      await policy.addToWhitelist(spenderA.address);
      expect(await policy.isWhitelisted(owner.address, spenderA.address)).to.be.true;
      expect(await policy.whitelistLength(owner.address)).to.equal(1);
    });

    it("should remove from whitelist", async function () {
      await policy.addToWhitelist(spenderA.address);
      await policy.removeFromWhitelist(spenderA.address);
      expect(await policy.isWhitelisted(owner.address, spenderA.address)).to.be.false;
    });

    it("should enumerate whitelist by index", async function () {
      await policy.addToWhitelist(spenderA.address);
      await policy.addToWhitelist(spenderB.address);
      const addr = await policy.whitelistAt(owner.address, 0);
      expect([spenderA.address, spenderB.address]).to.include(addr);
    });
  });

  describe("Global Blacklist", function () {
    it("BLACKLIST_MANAGER can add to blacklist", async function () {
      await expect(policy.addToBlacklist(spenderA.address))
        .to.emit(policy, "SpenderBlacklisted")
        .withArgs(spenderA.address);
      expect(await policy.isBlacklisted(spenderA.address)).to.be.true;
      expect(await policy.blacklistLength()).to.equal(1);
    });

    it("BLACKLIST_MANAGER can remove from blacklist", async function () {
      await policy.addToBlacklist(spenderA.address);
      await policy.removeFromBlacklist(spenderA.address);
      expect(await policy.isBlacklisted(spenderA.address)).to.be.false;
    });

    it("non-manager cannot blacklist", async function () {
      await expect(
        policy.connect(other).addToBlacklist(spenderA.address)
      ).to.be.revertedWithCustomError(policy, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Approval Validation", function () {
    it("should allow approval when no policy is set", async function () {
      const tokenAddr = await tokenA.getAddress();
      const [allowed] = await policy.validateAndRecordApproval.staticCall(
        tokenAddr, spenderA.address, ethers.parseEther("100")
      );
      expect(allowed).to.be.true;
    });

    it("should reject approval exceeding maxAllowance", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, ethers.parseEther("100"), 0, false);

      await expect(
        policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(policy, "ExceedsMaxAllowance");
    });

    it("should reject non-whitelisted spender when whitelistOnly", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, 0, 0, true);

      await expect(
        policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(policy, "SpenderNotWhitelisted");
    });

    it("should allow whitelisted spender when whitelistOnly", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, 0, 0, true);
      await policy.addToWhitelist(spenderA.address);

      const [allowed] = await policy.validateAndRecordApproval.staticCall(
        tokenAddr, spenderA.address, ethers.parseEther("100")
      );
      expect(allowed).to.be.true;
    });

    it("should reject blacklisted spender", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.addToBlacklist(spenderA.address);

      await expect(
        policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(policy, "SpenderIsBlacklisted");
    });

    it("should record approval with expiry", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, ethers.parseEther("1000"), 3600, false);

      await expect(
        policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("100"))
      ).to.emit(policy, "ApprovalRecorded");

      const record = await policy.approvalRecords(owner.address, tokenAddr, spenderA.address);
      expect(record.amount).to.equal(ethers.parseEther("100"));
      expect(record.expiresAt).to.be.gt(0);
    });
  });

  describe("Approval Expiry", function () {
    it("should detect expired approval", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, 0, 60, false); // 60s window
      await policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("100"));

      // Not expired yet
      expect(await policy.isApprovalExpired(owner.address, tokenAddr, spenderA.address)).to.be.false;

      // Advance time past expiry
      await time.increase(61);

      expect(await policy.isApprovalExpired(owner.address, tokenAddr, spenderA.address)).to.be.true;
    });

    it("should report no-expiry approval as not expired", async function () {
      const tokenAddr = await tokenA.getAddress();
      await policy.setTokenPolicy(tokenAddr, 0, 0, false); // no expiry
      await policy.validateAndRecordApproval(tokenAddr, spenderA.address, ethers.parseEther("100"));

      expect(await policy.isApprovalExpired(owner.address, tokenAddr, spenderA.address)).to.be.false;
    });
  });

  describe("Pausable (OpenZeppelin)", function () {
    it("admin can pause policy operations", async function () {
      await policy.pause();
      await expect(policy.registerWallet())
        .to.be.revertedWithCustomError(policy, "EnforcedPause");
    });

    it("admin can unpause", async function () {
      await policy.pause();
      await policy.unpause();
      await policy.registerWallet(); // Should succeed
    });

    it("non-admin cannot pause", async function () {
      await expect(
        policy.connect(other).pause()
      ).to.be.revertedWithCustomError(policy, "AccessControlUnauthorizedAccount");
    });
  });

  describe("AccessControl (OpenZeppelin)", function () {
    it("deployer has all roles", async function () {
      expect(await policy.hasRole(await policy.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await policy.hasRole(await policy.POLICY_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await policy.hasRole(await policy.BLACKLIST_MANAGER_ROLE(), owner.address)).to.be.true;
    });

    it("admin can grant roles to others", async function () {
      const role = await policy.BLACKLIST_MANAGER_ROLE();
      await policy.grantRole(role, other.address);
      expect(await policy.hasRole(role, other.address)).to.be.true;
    });
  });
});
