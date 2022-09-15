import { expect } from 'chai'
import { abi as agnosticoABI } from '../artifacts/contracts/IAgnostico.sol/IAgnostico.json'
import { abi as agnocodeABI } from '../artifacts/contracts/IAgnocode.sol/IAgnocode.json'
import { ethers , upgrades} from 'hardhat'

describe("Agnostico", function () {

  let agnostico
  let agnocode
  let signers
  let deployer
  let firstDeployer
  let claimer
  const pctEarn =  ethers.utils.parseEther('0.3')
  const deployCost = ethers.utils.parseEther('0.5')
  const oneEth = ethers.utils.parseEther('1')

  const tokenId = 777
  const IPFSLink = 'QmdBVMD1Zy1EXR9grQvuuX4DKac5JDVCojiG6aVApNByJ7'
  const WrongIPFSLink = 'Wrong Link'
  const bytecode = '0x60806040526040518060400160405280600381526020017f72657800000000000000000000000000000000000000000000000000000000008152506000908051906020019061004f929190610062565b5034801561005c57600080fd5b50610166565b82805461006e90610105565b90600052602060002090601f01602090048101928261009057600085556100d7565b82601f106100a957805160ff19168380011785556100d7565b828001600101855582156100d7579182015b828111156100d65782518255916020019190600101906100bb565b5b5090506100e491906100e8565b5090565b5b808211156101015760008160009055506001016100e9565b5090565b6000600282049050600182168061011d57607f821691505b6020821081141561013157610130610137565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b610232806101756000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063cfae321714610030575b600080fd5b61003861004e565b6040516100459190610119565b60405180910390f35b60606000805461005d9061018a565b80601f01602080910402602001604051908101604052809291908181526020018280546100899061018a565b80156100d65780601f106100ab576101008083540402835291602001916100d6565b820191906000526020600020905b8154815290600101906020018083116100b957829003601f168201915b5050505050905090565b60006100eb8261013b565b6100f58185610146565b9350610105818560208601610157565b61010e816101eb565b840191505092915050565b6000602082019050818103600083015261013381846100e0565b905092915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561017557808201518184015260208101905061015a565b83811115610184576000848401525b50505050565b600060028204905060018216806101a257607f821691505b602082108114156101b6576101b56101bc565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f830116905091905056fea26469706673582212207fd1e760028152a607ff6877c9d0e5b622df6be90366fe6b39f2484769b7f96564736f6c63430008070033'

  beforeEach(async () => {
    signers = await ethers.getSigners()
    deployer = signers[0]
    firstDeployer = signers[3]
    claimer = signers[5]
  // it("should not modify the address after upgrade", async() =>{
    const Agnostico = await ethers.getContractFactory("Agnostico");
    const AgnosticoV1 = await ethers.getContractFactory("AgnosticoV1");
    const _agnostico = await upgrades.deployProxy(Agnostico, { kind: 'uups' })
    await _agnostico.deployed()
    const upgradeAgno = await upgrades.upgradeProxy(_agnostico.address, AgnosticoV1)
    await upgradeAgno.deployed()

    const Agnocode = await ethers.getContractFactory("AgnoCodeFactory");
    const AgnocodeV1 = await ethers.getContractFactory("AgnoCodeV1");
    const _agnocode = await upgrades.deployProxy(Agnocode, { kind: 'uups' })
    await _agnocode.deployed()
    const upgradeCode = await upgrades.upgradeProxy(_agnocode.address, AgnocodeV1)
    await upgradeCode.deployed()

    agnostico = new ethers.Contract(upgradeAgno.address, agnosticoABI, deployer)
    agnocode = new ethers.Contract(upgradeCode.address, agnocodeABI, deployer)
    
    await agnostico.setCost(deployCost)
    await agnostico.setPctEarning(pctEarn) // 55%
    
    await agnostico.setAgnocode(agnocode.address)
    await agnocode.setAgnostico(agnostico.address)

    // await agnocode.setUri('https://ipfs.io/ipfs/')

    await agnostico.connect(firstDeployer).deployContract(bytecode, IPFSLink, { value: deployCost })
    
  });
  
  it("shouldn't modify the address after upgrade", async() => {
    expect(agnostico.address).to.equal(agnostico.address);
    expect(agnocode.address).to.equal(agnocode.address);
  })
  
  it("should return correct values for cost and agnocode", async() => {
    const cost = await agnostico.cost()
    const _agnocodeAgnostico = await agnocode.agnostico()
    expect(Number(cost)).to.equal(Number(deployCost));
    expect(await agnostico.agnocode()).to.equal(agnocode.address);
    expect(_agnocodeAgnostico).to.equal(agnostico.address);
  })
  
  // it("should return the correct uri for my erc721", async() => {
  //   const uri = await agnocode.uri();
  //   expect(uri).to.equal('https://ipfs.io/ipfs/')
  // })
  
  it("shouldn't mint if not called by agnostico", async() => {
    try{
      await agnocode.connect(deployer).mintTo(claimer.address, IPFSLink, tokenId)
    } catch(e) {
      expect(e.message).to.include('Not Agnostico')
    }
  })
  
  it("should let user mint their token from agnostico", async() => {
    // await agnostico.connect(firstDeployer).deployContract(bytecode, IPFSLink, { value: ethers.utils.parseEther('0.5') })
    // await agnostico.connect(claimer).claimHash(IPFSLink)
    await agnostico.connect(claimer).mintCode(IPFSLink)
    const tokenOwner = await agnocode.ownerOf(1)
    expect(tokenOwner).to.be.equal(claimer.address)
  })
  
  it("should return the correct uri for the tokenId", async() => {
    // await agnostico.connect(claimer).claimHash(IPFSLink)
    await agnostico.connect(claimer).mintCode(IPFSLink)
    const token1 = await agnocode.tokenURI(1)
    expect(token1).to.equal(`https://ipfs.io/ipfs/${IPFSLink}`)
  })

  it("should correctly return the firstDeployer", async() => {
    await agnostico.connect(claimer).deployContract(bytecode, WrongIPFSLink, { value: deployCost })
    const result1 = await agnostico.firstDeployers(IPFSLink)
    const result2 = await agnostico.firstDeployers(WrongIPFSLink)
    expect(result1).to.eq(firstDeployer.address)
    expect(result2).to.eq(claimer.address)
  })
  
  it("shouldn't let incorrect owner mint on behalf of owner", async() => {
    await agnostico.connect(claimer).claimHash(IPFSLink)
    try{
      await agnostico.connect(firstDeployer).mintCode(IPFSLink)
    } catch(e) {
      expect(e.message).to.include('Not Your Choice')
    }
  })

  it("shouldn't mint twice", async() => {
    await agnostico.connect(claimer).mintCode(IPFSLink)
    try { 
      await agnostico.connect(claimer).mintCode(IPFSLink)
    } catch(e) {
      expect(e.message).to.include('token already minted')
    }
  })
  
  it("should indicate if token has been minted", async() => {
    // await agnostico.connect(claimer).claimHash(IPFSLink)
    const previously = await agnostico.getHash(IPFSLink)
    await agnostico.connect(claimer).mintCode(IPFSLink)
    const recently = await agnostico.getHash(IPFSLink)
    expect(previously['minted']).to.be.false
    expect(recently['minted']).to.be.true
  })

  it("should enable claiming an unclaimed hash", async() => {
    const previously = await agnostico.getHash(IPFSLink)
    await agnostico.connect(claimer).claimHash(IPFSLink)
    const recently = await agnostico.getHash(IPFSLink)

    expect(previously.claimedBy).to.eq(ethers.constants.AddressZero)
    expect(recently.claimedBy).to.eq(claimer.address)
    expect(previously['claimedBy']).eq(ethers.constants.AddressZero)
    expect(recently['claimedBy']).to.be.eq(claimer.address)
  })
  
  it("should not allow claiming of the same hash twice", async() => {
    await agnostico.connect(claimer).claimHash(IPFSLink)
    try {
      await agnostico.connect(claimer).claimHash(IPFSLink)
    } catch(e) {
      expect(e.message).to.include('Previously Claimed')
    }
  })


  it("should return the full agnoHash queried", async() => {
    const hash = await agnostico.getHash(IPFSLink)
    expect(hash['agnoHash']).to.be.equal(IPFSLink)
  })
  
  it("should distribute correct earning to platform and users", async() => {
    const cost = await agnostico.cost()
    const zeroEth = ethers.constants.Zero
    const toFees1 = await agnostico.fees()
    
    const unclaimedUnMintedVal = zeroEth
    const claimedUnmintedVal = (Number(deployCost) * Number(pctEarn)) / Number(oneEth) / 3

    const claimedMintedVal = (deployCost.mul(pctEarn)).div(oneEth)
    
    const unclaimedUnMinted = await agnostico.pctEarnings(claimer.address)
    
    await agnostico.connect(claimer).claimHash(IPFSLink)
    await agnostico.connect(firstDeployer).deployContract(bytecode, IPFSLink, { value: deployCost })
    
    const claimedUnminted = await agnostico.pctEarnings(claimer.address)
    const toFees2 = await agnostico.fees()
    
    await agnostico.connect(claimer).mintCode(IPFSLink)
    await agnostico.connect(firstDeployer).deployContract(bytecode, IPFSLink, { value: deployCost })
    
    const claimedMinted = await agnostico.pctEarnings(claimer.address)
    const toFees3 = await agnostico.fees()
        
    const agnosticoBal = await ethers.provider.getBalance(agnostico.address)

    expect(Number(toFees1)).to.eq(Number(cost))
    expect(Number(toFees2)).to.eq(Number(toFees1) + (Number(cost) - claimedUnmintedVal))
    expect(Number(toFees3)).to.eq(Number(toFees2) + (Number(cost) - Number(claimedMintedVal)))
    expect(Number(unclaimedUnMinted)).to.eq(Number(unclaimedUnMintedVal)).to.eq(0)
    expect(Number(claimedUnminted)).to.eq(Number(claimedUnmintedVal))
    expect(Number(claimedMinted)).to.eq(Number(claimedMintedVal.add(claimedUnminted)))
    expect(divEth(agnosticoBal)).to.eq(1.5)
  })
  
  it("should enable successful fee withdrawal", async() => {
    const previous = await agnostico.fees()
    await agnostico.withdrawFees(deployer.address)
    const recent = await agnostico.fees()
    expect(divEth(previous)).to.equal(0.5)
    expect(divEth(recent)).to.equal(0)
  })
  
  it("should enable successful withdrawal of earnings", async() => {
    // await agnostico.connect(claimer).claimHash(IPFSLink)
    await agnostico.connect(claimer).mintCode(IPFSLink)
    const prevBal = await ethers.provider.getBalance(claimer.address)
    await agnostico.connect(firstDeployer).deployContract(bytecode, IPFSLink, { value: deployCost })
    const prev = await agnostico.pctEarnings(claimer.address)
    await agnostico.connect(claimer).withdrawEarning(1, claimer.address)
    const recent = await agnostico.pctEarnings(claimer.address)
    const recentBal = await ethers.provider.getBalance(claimer.address)

    
    const claimedMintedVal = (deployCost.mul(pctEarn)).div(oneEth)
    
    expect(Number(prev)).to.eq(Number(claimedMintedVal))
    expect(Number(recentBal)).to.be.greaterThan(Number(prevBal))
    expect(Number(recent)).to.eq(0)
  })

  it("should not withdraw by wrong owner", async() => {
    await agnostico.connect(claimer).claimHash(IPFSLink)
    await agnostico.connect(claimer).mintCode(IPFSLink)
    try {
      await agnostico.connect(deployer).withdrawEarning(1, claimer.address)
    } catch(e) {
      expect(e.message).to.include('Not Yours')
    }
  })
});


const divEth = (val) => Number(val) / Number(ethers.utils.parseEther('1'))
