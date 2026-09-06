const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PayrollPrototype", function () {
  let payroll;
  let token;

  let owner;
  let worker1;
  let worker2;
  let worker3;

  beforeEach(async function () {
    [owner, worker1, worker2, worker3] =
      await ethers.getSigners();

    const MockToken =
      await ethers.getContractFactory("MockToken");

    token = await MockToken.deploy();

    const Payroll =
      await ethers.getContractFactory("PayrollProto