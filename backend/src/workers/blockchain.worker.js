import { Worker } from "bullmq"

import { redisConnection } from "../config/redis.config.js"

import blockchainAudit from "../infrastructure/blockchain/audit.service.js"

import { createAuditLog } from "../modules/audit/audit.service.js"



new Worker(

  "blockchain-anchor",

  async job => {

    const result = await blockchainAudit.anchorRoot()



    if(!result) return



    await createAuditLog({

      eventType: "BLOCKCHAIN_ANCHORED",

      actorRole: "SYSTEM",

      payload: {

        merkleRoot: result.root,

        txHash: result.txHash

      }

    })



    return result

  },

  {

    connection: redisConnection,

    concurrency: 1

  }

)