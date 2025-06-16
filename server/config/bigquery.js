const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery({
  keyFilename: './service-account.json',
  projectId: 'frido-429506'
});


async function queryForBigQuery(query) {
    try {
        const [job] = await bigquery.createQueryJob({ query });
        console.log(`Job ${job.id} started.`);
        const [rows] = await job.getQueryResults();
        return rows;
    } catch (error) {
        console.error('Error querying BigQuery:', error);
        throw error;
    }
}

module.exports= queryForBigQuery;


  



