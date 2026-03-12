import { expect } from "chai";
import { ethers } from "hardhat";
import { ApprovalScanner, MockERC20 } from "../typechain-types";

describe("ApprovalScanner", function () {
  let scanner: ApprovalScanner;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: any;
  let spenderA: any;
  let spenderB: any;

  beforeEach(async function () {
    [owner, spenderA, spenderB] = await ethers.getSigners();

    const ScannerFactory = await ethers.getContractFactory("ApprovalScanner");
    scanner = await ScannerFactory.deploy();

    const MockFactory = await ethers.getContractFactory("MockERC20");
    tokenA = await MockFactory.deploy("Token A", "TKA");
    tokenB = await MockFactory.deploy("Token B", "TKB");
  });

  describe("checkAllowance", function () {
    it("should return 0 for no approval", async function () {
      const allowance = await scanner.checkAllowance(
        await tokenA.getAddress(),
        owner.address,
        spenderA.address
      );
      expect(allowance).to.equal(0);
    });

    it("should return correct allowance after approve", async function () {
      const amount = ethers.parseEther("100");
      await tokenA.approve(spenderA.address, amount);

      const allowance = await scanner.checkAllowance(
        await tokenA.getAddress(),
        owner.address,
        spenderA.address
      );
      expect(allowance).to.equal(amount);
    });

    it("should detect unlimited approval", async function () {
      await tokenA.approve(spenderA.address, ethers.MaxUint256);

      const allowance = await scanner.checkAllowance(
        await tokenA.getAddress(),
        owner.address,
        spenderA.address
      );
      expect(allowance).to.equal(ethers.MaxUint256);
    });
  });

  describe("batchCheckAllowances", function () {
    it("should batch-check multiple allowances", async function () {
      const amountA = ethers.parseEther("50");
      const amountB = ethers.parseEther("200");
      await tokenA.approve(spenderA.address, amountA);
      await tokenB.approve(spenderB.address, amountB);

      const allowances = await scanner.batchCheckAllowances(
        [await tokenA.getAddress(), await tokenB.getAddress()],
        [spenderA.address, spenderB.address],
        owner.address
      );
      expect(allowances[0]).to.equal(amountA);
      expect(allowances[1]).to.equal(amountB);
    });

    it("should revert on length mismatch", async function () {
      await expect(
        scanner.batchCheckAllowances(
          [await tokenA.getAddress()],
          [spenderA.address, spenderB.address],
          owner.address
        )
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("getAtRiskValue", function () {
    it("should sum all at-risk amounts", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");
      await tokenA.approve(spenderA.address, amountA);
      await tokenB.approve(spenderB.address, amountB);

      const totalAtRisk = await scanner.getAtRiskValue(
        [await tokenA.getAddress(), await tokenB.getAddress()],
        [spenderA.address, spenderB.address],
        owner.address
      );
      expect(totalAtRisk).to.equal(amountA + amountB);
    });
  });
});
