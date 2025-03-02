import { Request } from 'express';
import { EntityManager } from 'typeorm';
import { Organisation } from '../entity/organisation';
import { Result } from '../entity/result';

export async function search(
    manager: EntityManager,
    organisation: Organisation,
    params: Request['query'],
) {
    const {
        page, // Optional parameter
        patientName,
        sampleBarcode,
        activationDate,
        resultDate,
        patientId, // New parameter for patient ID search
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

    // Add filters
    if (patientName) {
        query.andWhere('profile.name ILIKE :patientName', { patientName: `%${patientName}%` });
    }
    if (sampleBarcode) {
        query.andWhere('result.sampleId ILIKE :sampleBarcode', { sampleBarcode: `%${sampleBarcode}%` });
    }
    if (activationDate) {
        query.andWhere('DATE(result.activateTime) = :activationDate', { activationDate });
    }
    if (resultDate) {
        query.andWhere('DATE(result.resultTime) = :resultDate', { resultDate });
    }
    if (patientId) { // New condition for patient ID
        query.andWhere('profile.profileId = :patientId', { patientId });
    }

    // Fetch all results if `page` is not provided
    if (!page) {
        const [results, total] = await query.getManyAndCount(); // Get all results and total count

        const data = results.map((result) => {
            // Base response structure
            const baseResponse = {
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
            };

            // Add extra fields for Circle organisation
            if (organisation.name === 'Circle') {
                return {
                    ...baseResponse,
                    attributes: {
                        ...baseResponse.attributes,
                        resultType: result.type, // Add `resultType`
                        patientId: result.profile.profileId, // Add `patientId`
                    },
                };
            }

            return baseResponse;
        });

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

    const data = paginatedResults.map((result) => {
        // Base response structure
        const baseResponse = {
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
        };

        // Add extra fields for Circle organisation
        if (organisation.name === 'circle') {
            return {
                ...baseResponse,
                attributes: {
                    ...baseResponse.attributes,
                    resultType: result.type, // Add `resultType`
                    patientId: result.profile.profileId, // Add `patientId`
                },
            };
        }

        return baseResponse;
    });

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
