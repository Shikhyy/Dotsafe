import { expect } from "chai";
import { ethers } from "hardhat";
import { BatchRevoker, MockERC20 } from "../typechain-types";

describe("BatchRevoker", function () {
  let revoker: BatchRevoker;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: any;
  let spenderA: any;
  let spenderB: any;

  beforeEach(async function () {
    [owner, spenderA, spenderB] = await ethers.getSigners();

    const RevokerFactory = await ethers.getContractFactory("BatchRevoker");
    revoker = await RevokerFactory.deploy();

    const MockFactory = await ethers.getContractFactory("MockERC20");
    tokenA = await MockFactory.deploy("Token A", "TKA");
    tokenB = await MockFactory.deploy("Token B", "TKB");
  });

  describe("revokeERC20", function () {
    it("should revoke a single ERC-20 approval", async function () {
      await tokenA.approve(spenderA.address, ethers.parseEther("100"));
      expect(await tokenA.allowance(owner.address, spenderA.address)).to.be.gt(0);

      await revoker.revokeERC20(await tokenA.getAddress(), spenderA.address);
    });

    it("should emit BatchRevoked event", async function () {
      await tokenA.approve(spenderA.address, ethers.parseEther("100"));
      await expect(revoker.revokeERC20(await tokenA.getAddress(), spenderA.address))
        .to.emit(revoker, "BatchRevoked")
        .withArgs(owner.address, 1);
    });

    it("should increment totalRevocations", async function () {
      await revoker.revokeERC20(await tokenA.getAddress(), spenderA.address);
      expect(await revoker.totalRevocations()).to.equal(1);
    });

    it("should track per-user revocation count", async function () {
      await revoker.revokeERC20(await tokenA.getAddress(), spenderA.address);
      expect(await revoker.userRevocationCount(owner.address)).to.equal(1);
    });
  });

  describe("batchRevokeERC20", function () {
    it("should batch revoke multiple ERC-20 approvals", async function () {
      await tokenA.approve(spenderA.address, ethers.parseEther("100"));
      await tokenB.approve(spenderB.address, ethers.parseEther("200"));

      await expect(
        revoker.batchRevokeERC20(
          [await tokenA.getAddress(), await tokenB.getAddress()],
          [spenderA.address, spenderB.address]
        )
      ).to.emit(revoker, "BatchRevoked");
    });

    it("should revert on empty arrays", async function () {
      await expect(revoker.batchRevokeERC20([], []))
        .to.be.revertedWithCustomError(revoker, "EmptyArrays");
    });

    it("should revert on length mismatch", async function () {
      await expect(
        revoker.batchRevokeERC20(
          [await tokenA.getAddress()],
          [spenderA.address, spenderB.address]
        )
      ).to.be.revertedWithCustomError(revoker, "LengthMismatch");
    });

    it("should revert when batch exceeds MAX_BATCH_SIZE", async function () {
      const tokens = Array(51).fill(await tokenA.getAddress());
      const spenders = Array(51).fill(spenderA.address);
      await expect(revoker.batchRevokeERC20(tokens, spenders))
        .to.be.revertedWithCustomError(revoker, "BatchTooLarge");
    });
  });

  describe("batchRevokeNFT", function () {
    it("should revert on empty arrays", async function () {
      await expect(revoker.batchRevokeNFT([], []))
        .to.be.revertedWithCustomError(revoker, "EmptyArrays");
    });

    it("should revert on length mismatch", async function () {
      await expect(
        revoker.batchRevokeNFT(
          [await tokenA.getAddress()],
          [spenderA.address, spenderB.address]
        )
      ).to.be.revertedWithCustomError(revoker, "LengthMismatch");
    });
  });

  describe("Pausable (OpenZeppelin)", function () {
    it("owner can pause and unpause", async function () {
      await revoker.pause();
      await expect(
        revoker.revokeERC20(await tokenA.getAddress(), spenderA.address)
      ).to.be.revertedWithCustomError(revoker, "EnforcedPause");

      await revoker.unpause();
      await revoker.revokeERC20(await tokenA.getAddress(), spenderA.address);
    });

    it("non-owner cannot pause", async function () {
      await expect(
        revoker.connect(spenderA).pause()
      ).to.be.revertedWithCustomError(revoker, "OwnableUnauthorizedAccount");
    });
  });
});
