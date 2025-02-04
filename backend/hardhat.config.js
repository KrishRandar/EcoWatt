require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19", // ✅ Add this to match your contract pragma
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
};
