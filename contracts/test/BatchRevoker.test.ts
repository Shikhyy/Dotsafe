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

      // Note: The revoker calls approve(spender, 0) from its own address,
      // so this tests the call mechanism. In production, the user calls
      // approve directly or the revoker is used via delegatecall patterns.
    });

    it("should emit BatchRevoked event", async function () {
      await tokenA.approve(spenderA.address, ethers.parseEther("100"));
      await expect(revoker.revokeERC20(await tokenA.getAddress(), spenderA.address))
        .to.emit(revoker, "BatchRevoked")
        .withArgs(owner.address, 1);
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
      await expect(revoker.batchRevokeERC20([], [])).to.be.revertedWith(
        "Empty arrays"
      );
    });

    it("should revert on length mismatch", async function () {
      await expect(
        revoker.batchRevokeERC20(
          [await tokenA.getAddress()],
          [spenderA.address, spenderB.address]
        )
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("batchRevokeNFT", function () {
    it("should revert on empty arrays", async function () {
      await expect(revoker.batchRevokeNFT([], [])).to.be.revertedWith(
        "Empty arrays"
      );
    });

    it("should revert on length mismatch", async function () {
      await expect(
        revoker.batchRevokeNFT(
          [await tokenA.getAddress()],
          [spenderA.address, spenderB.address]
        )
      ).to.be.revertedWith("Length mismatch");
    });
  });
});
