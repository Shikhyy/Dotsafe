import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DotSafeModule = buildModule("DotSafe", (m) => {
  const approvalScanner = m.contract("ApprovalScanner");
  const batchRevoker = m.contract("BatchRevoker");
  const xcmGuard = m.contract("XCMGuard");

  return { approvalScanner, batchRevoker, xcmGuard };
});

export default DotSafeModule;
