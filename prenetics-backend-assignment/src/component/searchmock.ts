import { Request } from 'express';
import { EntityManager } from 'typeorm';
import { Organisation } from '../entity/organisation';
import { ResultType } from './type';
import { v4 as uuidv4 } from 'uuid';

export async function search(
    manager: EntityManager,
    organisation: Organisation,
    params: Request['params'],
) {
    // Implement search function;
    return {
        meta: {
            total: 35,
        },
        data: [
            {
                id: '1c22dfc1-9c85-4ef9-a9d3-41a1e98a4d41',
                type: 'sample',
                attributes: {
                    result: 'negative',
                    sampleId: '1234567890',
                    resultType: ResultType.rtpcr,
                    activateTime: '2021-07-12 15:00:00',
                    resultTime: '2021-07-12 16:00:00',
                },
                relationships: {
                    profile: {
                        data: {
                            type: 'profile',
                            id: 'b66df241-e780-4c9c-aeb1-0efc4946face',
                        },
                    },
                },
            },
            {
                id: '98627793-ee13-4eaf-a304-9e628d110f3c',
                type: 'sample',
                attributes: {
                    result: 'negative',
                    sampleId: '0987654321',
                    resultType: ResultType.rtpcr,
                    activateTime: '2021-07-12 19:00:00',
                    resultTime: '2021-07-12 20:00:00',
                },
                relationships: {
                    profile: {
                        data: {
                            type: 'profile',
                            id: '0bf3bd3b-75bc-4540-ba04-a19ab5e9382c',
                        },
                    },
                },
            },
            {
                id: 'ab5b87ef-e44f-4b1f-98cb-992f2104ef8f',
                type: 'sample',
                attributes: {
                    result: 'negative',
                    sampleId: '109876543211',
                    resultType: ResultType.antigen,
                    activateTime: '2021-07-13 15:00:00',
                    resultTime: '2021-07-13 16:00:00',
                },
                relationships: {
                    profile: {
                        data: {
                            type: 'profile',
                            id: 'b50d027e-d8c5-496b-8665-dd2281ab1b32',
                        },
                    },
                },
            },
            {
                id: '8423dfd3-37b5-4c62-a37c-729e410d19e5',
                type: 'sample',
                attributes: {
                    result: 'negative',
                    sampleId: '121212121212',
                    resultType: ResultType.antibody,
                    activateTime: '2021-07-14 15:00:00',
                    resultTime: '2021-07-14 16:00:00',
                },
                relationships: {
                    profile: {
                        data: {
                            type: 'profile',
                            id: '97932431-d7de-48ec-9f51-d0d78170ffe9',
                        },
                    },
                },
            },
            {
                id: '567a8b28-c1ab-467d-85ff-04fbcb24cb9a',
                type: 'sample',
                attributes: {
                    result: 'negative',
                    sampleId: '181818188181',
                    resultType: ResultType.antigen,
                    activateTime: '2021-07-15 15:00:00',
                    resultTime: '2021-07-15 16:00:00',
                },
                relationships: {
                    profile: {
                        data: {
                            type: 'profile',
                            id: '47d67686-b77f-47e8-92e4-76f1b5f1bc92',
                        },
                    },
                },
            },
        ].concat(generateSampleRecords()),
        included: [
            {
                type: 'profile',
                id: 'b66df241-e780-4c9c-aeb1-0efc4946face',
                attributes: {
                    name: 'Peter Chan',
                },
            },
            {
                type: 'profile',
                id: '47d67686-b77f-47e8-92e4-76f1b5f1bc92',
                attributes: {
                    name: 'Michael Caine',
                },
            },
            {
                type: 'profile',
                id: '97932431-d7de-48ec-9f51-d0d78170ffe9',
                attributes: {
                    name: 'Bruce Lee',
                },
            },
            {
                type: 'profile',
                id: 'b50d027e-d8c5-496b-8665-dd2281ab1b32',
                attributes: {
                    name: 'John Locke',
                },
            },
            {
                type: 'profile',
                id: '0bf3bd3b-75bc-4540-ba04-a19ab5e9382c',
                attributes: {
                    name: 'Andrea Lau',
                },
            },
        ],
    };
}

// Function to generate a single sample record
function generateSampleRecord(index: number): any {
    const sampleId = (Math.floor(1000000000 + Math.random() * 9000000000)).toString(); // Random 10-digit sample ID
    const activateTime = new Date(2021, 6, 12, 15, 0, 0); // Fixed start date (2021-07-12 15:00:00)
    const resultTime = new Date(activateTime);
    resultTime.setHours(activateTime.getHours() + 1); // +1 hour

    return {
        id: uuidv4(),
        type: 'sample',
        attributes: {
            result: Math.random() > 0.5 ? 'negative' : 'positive', // Randomly assign result
            sampleId: sampleId,
            resultType: Math.random() > 0.5 ? ResultType.rtpcr : ResultType.antigen, // Randomly select resultType
            activateTime: activateTime.toISOString().replace('T', ' ').slice(0, 19), // Format: YYYY-MM-DD HH:mm:ss
            resultTime: resultTime.toISOString().replace('T', ' ').slice(0, 19),
        },
        relationships: {
            profile: {
                data: {
                    type: 'profile',
                    id: 'b66df241-e780-4c9c-aeb1-0efc4946face',
                },
            },
        },
    };
}

// Function to generate 30 sample records
function generateSampleRecords(count: number = 30): any {
    const records = [];
    for (let i = 0; i < count; i++) {
        records.push(generateSampleRecord(i + 1));
    }
    // return { data: records };
    return records;
}
