import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DotSafeModule = buildModule("DotSafe", (m) => {
  const approvalScanner = m.contract("ApprovalScanner");
  const batchRevoker = m.contract("BatchRevoker");
  const xcmGuard = m.contract("XCMGuard");
  const approvalPolicy = m.contract("ApprovalPolicy");

  return { approvalScanner, batchRevoker, xcmGuard, approvalPolicy };
});

export default DotSafeModule;
