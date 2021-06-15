//const process = require('process');

const Knex = require('knex');


 // Set up a variable to hold our connection pool. It would be safe to
 // initialize this right away, but we defer its instantiation to ease
 // testing different configurations.
 let pool;
 
 // [START cloud_sql_postgres_knex_create_tcp]
 const createTcpPool = config => {
   // Extract host and port from socket address
   const dbSocketAddr = process.env.DB_HOST.split(':'); // e.g. '127.0.0.1:5432'
 
   // Establish a connection to the database
   return Knex({
     client: 'pg',
     connection: {
       user: process.env.DB_USER,//process.env.DB_USER, // e.g. 'my-user'
       password: process.env.DB_PASS, // e.g. 'my-user-password'
       database: process.env.DB_NAME, // e.g. 'my-database'
       host: dbSocketAddr[0], // e.g. '127.0.0.1'
       port: dbSocketAddr[1] // e.g. '5432'
     },
     // ... Specify additional properties here.
     ...config,
   });
 };
 // [END cloud_sql_postgres_knex_create_tcp]
 
 // [START cloud_sql_postgres_knex_create_socket]
 const createUnixSocketPool = config => {
  const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';
 
  // Establish a connection to the database
  return Knex({
    client: 'pg',
    connection: {
      user: process.env.DB_USER, // e.g. 'my-user'
      password: process.env.DB_PASS, // e.g. 'my-user-password'
      database: process.env.DB_NAME, // e.g. 'my-database'
      host: `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    },
     // ... Specify additional properties here.
     ...config,
   });
 };
 // [END cloud_sql_postgres_knex_create_socket]
 
 // Initialize Knex, a Node.js SQL query builder library with built-in connection pooling.
 const createPool = () => {
   // Configure which instance and what database user to connect with.
   // Remember - storing secrets in plaintext is potentially unsafe. Consider using
   // something like https://cloud.google.com/kms/ to help keep secrets secret.
   const config = {pool: {}};
 
   // [START cloud_sql_postgres_knex_limit]
   // 'max' limits the total number of concurrent connections this pool will keep. Ideal
   // values for this setting are highly variable on app design, infrastructure, and database.
   config.pool.max = 5;
   // 'min' is the minimum number of idle connections Knex maintains in the pool.
   // Additional connections will be established to meet this value unless the pool is full.
   config.pool.min = 5;
   // [END cloud_sql_postgres_knex_limit]
 
   // [START cloud_sql_postgres_knex_timeout]
   // 'acquireTimeoutMillis' is the number of milliseconds before a timeout occurs when acquiring a
   // connection from the pool. This is slightly different from connectionTimeout, because acquiring
   // a pool connection does not always involve making a new connection, and may include multiple retries.
   // when making a connection
   config.pool.acquireTimeoutMillis = 600000; // 60 seconds
   // 'createTimeoutMillis` is the maximum number of milliseconds to wait trying to establish an
   // initial connection before retrying.
   // After acquireTimeoutMillis has passed, a timeout exception will be thrown.
   config.createTimeoutMillis = 30000; // 30 seconds
   // 'idleTimeoutMillis' is the number of milliseconds a connection must sit idle in the pool
   // and not be checked out before it is automatically closed.
   config.idleTimeoutMillis = 600000; // 10 minutes
   // [END cloud_sql_postgres_knex_timeout]
 
   // [START cloud_sql_postgres_knex_backoff]
   // 'knex' uses a built-in retry strategy which does not implement backoff.
   // 'createRetryIntervalMillis' is how long to idle after failed connection creation before trying again
   config.createRetryIntervalMillis = 200; // 0.2 seconds
   // [END cloud_sql_postgres_knex_backoff]
 
   if (false) {
     return createTcpPool(config);
   } else {
     return createUnixSocketPool(config);
   }
 };
 const getstocks = async pool => {
   return await pool
     .select('entryid','product','description','stock')
     .from('stockentries').orderBy('entryid','desc');

     
 };



// const getStockById = async (pool, id) => {
//   try {
//     return await pool
//     .select('entryid','product','description','stock')
//     .from('stockentries').where('entryid',id);
//   } catch (err) {
//     throw Error(err);
//   }
// };


const addstock = async (pool, stock) => {
   try {
     return await pool('stockentries').insert(stock);
   } catch (err) {
     throw Error(err);
   }
 };


//  const removestock = async (pool, id) => {
//   try {
//     return await pool('stockentries').delete({key:'entryid'}).where('entryid',id);
//   } catch (err) {
//     throw Error(err);
//   }
// };



//  const updateStocks = async (pool, stock) => {
//   delete stock.Apartment; 
//   try {
//     //return await pool('stocks').delete(stock);
//     return await pool('stockentries').update(stock).where('entryid', stock.entryid);
//   } catch (err) {
//     throw Error(err);
//   }
// };
 // Create a Winston logger that streams to Stackdriver Logging.
 const winston = require('winston');
 const {LoggingWinston} = require('@google-cloud/logging-winston');
 const loggingWinston = new LoggingWinston();
 const logger = winston.createLogger({
   level: 'info',
   transports: [new winston.transports.Console(), loggingWinston],
 });

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      pool = pool || createPool();

              try{
                const builds = await getstocks(pool);
                for (let index = 0; index < builds.length; index++) {
                  builds[index].link = '/api/product/'+builds[index].entryid;
                  
                }
                console.log(builds);
                
                      res
                    .status(200)
                    .send(JSON.stringify(builds));
                   // .end();
              }catch (err) {
                  console.error(err);
                  
                  res
                    .status(500)
                    .send('Unable to load page; see logs for more details.');
         //           .end();
              }
              
      break;
      case 'POST':
        pool = pool || createPool();
        try {
                if(req.body.hasOwnProperty('entryid'))
                  {
                    delete req.body.entryid; 
                  }

           await addstock(pool,req.body);
            res.status(201).send(req.body);
        } catch (err) {
            logger.error(`Error while attempting create product :${err}`);
     
            res
            .status(500)
            .send('Unable to add product stock. See logs for more details.');
          
            return;
        }
      break;
    default:
      res.status(405).send("Method "+ req.method+" not Implemented in this path");
        
      break;
  }
  
   
  }