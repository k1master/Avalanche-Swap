// test/Airdrop.js
// Load dependencies
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Wrapper', function () {
  before(async function () {
    this.Wrapper = await ethers.getContractFactory('Wrapper');
    this.TestToken = await ethers.getContractFactory('TestToken');
  });

  beforeEach(async function () {
    
    this.tokenA = await this.TestToken.deploy("Avalanche-test-token-A", "AVTA");
    this.tokenB = await this.TestToken.deploy("Avalanche-test-token-B", "AVTB");
    this.tokenC = await this.TestToken.deploy("Avalanche-test-token-C", "AVTC");
    
    await this.tokenA.deployed();
    await this.tokenB.deployed();
    await this.tokenC.deployed();

    this.wrapper = await this.Wrapper.deploy(this.tokenC.address);
    await this.wrapper.deployed();

    const [alice, bob] = await ethers.getSigners();

    this.swapper = await this.wrapper.connect(alice);
    this.alice = alice;
    this.bob = bob;
  })

  it('swap fails when token A holder did\'t approve', async function () {
    const alice = await this.tokenA.connect(this.alice);
    await alice.mint(30);

    await expect(
      this.swapper.swap(this.tokenA.address, 10)
    ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
  })

  it('swap fails when token A tries to swap beyond its allowance', async function () {
    const alice = await this.tokenA.connect(this.alice);
    await alice.approve(this.wrapper.address, 10);
    await alice.mint(30);

    await expect(
      this.swapper.swap(alice.address, 20)
    ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
  })

  it('swap fails when token A tries to swap more than his balance', async function () {
    const alice = await this.tokenA.connect(this.alice);
    await alice.approve(this.wrapper.address, 30);
    await alice.mint(10);

    await expect(
      this.wrapper.swap(alice.address, 20)
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
  })

  it('swap fails and token A holder will keep his balance when wrapper doesn\'t have enough token C', async function () {
    const alice = await this.tokenA.connect(this.alice);
    const bob = await this.tokenC.connect(this.bob);

    await alice.mint(50);
    await alice.approve(this.wrapper.address, 100);
    await bob.mint(10);
    await bob.transfer(this.wrapper.address, 10);

    await expect(
      this.wrapper.swap(this.tokenA.address, 20)
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance')

    expect(
      await this.tokenA.balanceOf(this.alice.address)
    ).to.be.equal(50)
  })

  it('swap succeeds', async function () {
    const alice = await this.tokenA.connect(this.alice);
    await alice.mint(50);
    await alice.approve(this.wrapper.address, 100);

    const aliceC = await this.tokenC.connect(this.alice);
    await aliceC.approve(this.wrapper.address, 100);

    const bob = await this.tokenC.connect(this.bob);
    await bob.mint(50);
    await bob.transfer(this.wrapper.address, 50);

    const bobB = await this.tokenB.connect(this.bob);
    await bobB.mint(50);
    await bobB.transfer(this.wrapper.address, 50);

    await this.swapper.swap(this.tokenA.address, 20);

    expect(
      await this.tokenA.balanceOf(this.alice.address)
    ).to.equal(30)

    expect(
      await this.tokenC.balanceOf(this.alice.address)
    ).to.equal(20)

    expect(
      await this.tokenA.balanceOf(this.wrapper.address)
    ).to.equal(20)

    expect(
      await this.tokenC.balanceOf(this.wrapper.address)
    ).to.equal(30)

    await this.swapper.unswap(this.tokenB.address, 5);

    expect(
      await this.tokenB.balanceOf(this.alice.address)
    ).to.equal(5)

    expect(
      await this.tokenC.balanceOf(this.alice.address)
    ).to.equal(15)
  })

  it('unswap succeeds', async function () {
    const alice = this.tokenC.connect(this.alice);
    await alice.mint(50);
    await alice.approve(this.wrapper.address, 100);

    const bob = this.tokenA.connect(this.bob);
    await bob.mint(50);
    await bob.transfer(this.wrapper.address, 50);

    await this.swapper.unswap(this.tokenA.address, 20);

    expect(
      await this.tokenA.balanceOf(this.alice.address)
    ).to.equal(20)

    expect(
      await this.tokenC.balanceOf(this.alice.address)
    ).to.equal(30)

    expect(
      await this.tokenA.balanceOf(this.wrapper.address)
    ).to.equal(30)

    expect(
      await this.tokenC.balanceOf(this.wrapper.address)
    ).to.equal(20)
  })
})