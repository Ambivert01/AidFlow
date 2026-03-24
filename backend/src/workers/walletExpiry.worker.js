import { Worker } from "bullmq"
import { redisConnection } from "../config/redis.config.js"

import { Wallet } from "../models/Wallet.model.js"
import { createAuditLog } from "../modules/audit/audit.service.js"

new Worker(

  "wallet-expiry",

  async ()=>{

    const wallets = await Wallet.find({

      status:"ACTIVE",

      "policy.expiresAt":{$lt:new Date()}

    })

    for(const wallet of wallets){

      wallet.status="EXPIRED"

      await wallet.save()

      await createAuditLog({

        eventType:"WALLET_EXPIRED",

        entityId: wallet._id,

        actorRole:"SYSTEM"

      })

    }

  },

  {

    connection: redisConnection

  }

)