node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

node -e "console.log(require('ethers').Wallet.createRandom())"
