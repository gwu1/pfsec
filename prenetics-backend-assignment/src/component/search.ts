import { Request } from 'express';
import { EntityManager } from 'typeorm';
import { Organisation } from '../entity/organisation';
// import { ResultType } from './type';
import { Result } from '../entity/result';

export async function search(
    manager: EntityManager,
    organisation: Organisation,
    params: Request['query'],
) {
    // Implement search function;
    const {
        page, // Optional parameter
    } = params;
    const limit = 15; // Fixed page size
    const query = manager.createQueryBuilder(Result, 'result')
        .innerJoinAndSelect('result.profile', 'profile') // Join the Profile entity
        .innerJoinAndSelect(
            'profile.organisation',
            'organisation',
            'organisation.organisationId = :organisationId',
            { organisationId: organisation.organisationId }
        );

    // Fetch all results if `page` is not provided
    if (!page) {
        const [results, total] = await query.getManyAndCount(); // Get all results and total count

        const data = results.map((result) => ({
            id: result.resultId,
            type: 'sample',
            attributes: {
                result: result.result,
                sampleId: result.sampleId,
                activateTime: result.activateTime,
                resultTime: result.resultTime,
            },
            relationships: {
                profile: {
                    data: {
                        type: 'profile',
                        id: result.profile.profileId,
                    },
                },
            },
        }));

        return {
            meta: {
                total,
                currentPage: null, // No pagination
                totalPages: null, // No pagination
            },
            data,
        };
    }

    // Handle paginated results if `page` is provided
    const total = await query.getCount(); // Get the total count of results
    const totalPages = Math.ceil(total / limit);
    const currentPage = Number(page);

    // Calculate offset
    const offset = (currentPage - 1) * limit;

    // Fetch results for the current page
    const paginatedResults = await query.take(limit).skip(offset).getMany();

    const data = paginatedResults.map((result) => ({
        id: result.resultId,
        type: 'sample',
        attributes: {
            result: result.result,
            sampleId: result.sampleId,
            activateTime: result.activateTime,
            resultTime: result.resultTime,
        },
        relationships: {
            profile: {
                data: {
                    type: 'profile',
                    id: result.profile.profileId,
                },
            },
        },
    }));

    return {
        meta: {
            total,
            currentPage,
            totalPages,
            currentPageItems: currentPage === totalPages ? total % limit || limit : limit, // Handle last page items
        },
        data,
    };
}


