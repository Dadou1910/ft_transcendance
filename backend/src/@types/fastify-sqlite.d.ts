declare module 'fastify-sqlite' {
    import { FastifyPluginCallback } from 'fastify'
    
    interface FastifySQLiteOptions {
      db: string
      verbose?: boolean
      readonly?: boolean
    }
  
    const fastifySqlite: FastifyPluginCallback<FastifySQLiteOptions>
    
    export default fastifySqlite
  }