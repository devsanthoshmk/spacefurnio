import { neon } from '@neondatabase/serverless';

async function testConnection() {
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5lb24tZWNvbW1lcmNlLWtleS0xIn0.eyJzdWIiOiI0OTM2NDM1NS01YmNiLTQ2NDUtYWE5OS02MTliZDM3Mzg3OGMiLCJlbWFpbCI6ImFkbWluQHN0b3JlLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3MjY3OTMzM30.F_9FacjI1IUWkpWuLwWrrdTsEq12dHEOFmRaY4F_HiKKxJ23GgJkFPHLXL54YhdxdiH8DlPUkxHrERympeK2YbvCglha6_GHF4-Mghcgz4I6x--R_maingrXTg3JkYPAsV6qFfximAv-ujEMUFvvHEYyWDyHmBWfadAv980i0I9iv0dlZLyxno9oH8vhQxBDZdPoO1-_sJax0FqRPUdDVC-k4yfrUZ7iL9tbFN-DQ6v0tW7bnsLtgmKBGwHECGDWFriJ4JkWVHNHEZlZjd9VZ9bksQBi2YxVcGtd-l7ARjNK4hc2wjiFfbDed_PF_64yeVs7gZe-IAFqzh-O3i-Hww';

    const sql1 = neon('postgresql://neondb_owner@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require', { authToken: token });

    try {
        const result1 = await sql1`SELECT current_user, current_role`;
        console.log('Success with neondb_owner role:', result1);
    } catch (err: any) {
        console.error('Error with neondb_owner role:', err.message);
    }
}

testConnection();
