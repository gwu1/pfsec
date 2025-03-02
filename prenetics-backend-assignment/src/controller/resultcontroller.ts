import { Request, Response } from 'express';
import { getManager, getRepository } from 'typeorm';
import { logger } from '../component/logger';
import { search } from '../component/search';
import { Organisation } from '../entity/organisation';
import { Profile } from '../entity/profile';
import { Result } from '../entity/result';

export const resultController = new class {

    getResults = async (request: Request, response: Response) => {
        request.checkParams('org', 'org is not valid').isUUID();
        const errors = request.validationErrors();
        if (errors) {
            response.status(400).json(errors);
            return;
        }
        const { org, } = request.params;
        try {
            const manager = getManager();
            const organisation = await manager.findOne(Organisation, {
                where: {
                    organisationId: org,
                }
            });
            if (!organisation) {
                response.status(404).json({ msg: 'Organisation not found' });
            } else {
                const result = await search(
                    manager,
                    organisation,
                    request.query, // Pass request.query to the search function
                );
                response.status(200).json(result);
            }
        } catch (err) {
            logger.error(err.message);
            response.status(500).json({ msg: 'Something went wrong' });
        }
    }

    getProfileResult = async (request: Request, response: Response) => {
        request.checkParams('org', 'org is not valid').isUUID();
        request.checkParams('profileId', 'profileId is not valid').isUUID();
        request.checkParams('sampleId', 'sampleId is not valid').isString().notEmpty();
        const errors = request.validationErrors();
        if (errors) {
            response.status(400).json(errors);
            return;
        }

        const { org, profileId, sampleId } = request.params;
        try {
            const resultEnt = await getManager()
                .createQueryBuilder()
                .select('result')
                .from(Result, 'result')
                .innerJoin(
                    'result.profile',
                    'profile',
                    'profile.profileId = :profileId',
                    {
                        profileId,
                    }
                )
                .innerJoin(
                    'profile.organisation',
                    'organisation',
                    'organisation.organisationId = :organisationId',
                    {
                        organisationId: org,
                    }
                )
                .where(
                    'result.sampleId = :sampleId',
                    {
                        sampleId,
                    }
                )
                .getOne();
            if (resultEnt) {
                const { activateTime, resultTime, result, type: resultType, sampleId, resultId: id, } = resultEnt;
                response.status(200).json({
                    data: {
                        id,
                        type: 'sample',
                        attributes: {
                            result,
                            sampleId,
                            resultType,
                            activateTime,
                            resultTime,
                        },
                    },
                });
            } else {
                response.status(404).json({ msg: 'Result not found' });
            }
        } catch (err) {
            logger.error(err.message);
            response.status(500).json({ msg: 'Something went wrong' });
        }
    }

    addResult = async (request: Request, response: Response) => {
        request.checkParams('org', 'org is not valid').isUUID();
        request.checkParams('profileId', 'profileId is not valid').isUUID();
        request.checkBody('data.type', 'type is not valid').equals('sample');
        request.checkBody('data.attributes.sampleId', 'sampleId is not valid').notEmpty();
        request.checkBody('data.attributes.resultType', 'resultType is not valid').notEmpty();
        const errors = request.validationErrors();
        if (errors) {
            response.status(400).json(errors);
            return;
        }

        try {
            const { org, profileId } = request.params;
            const profile = await getManager()
                .createQueryBuilder()
                .select('profile')
                .from(Profile, 'profile')
                .innerJoin(
                    'profile.organisation',
                    'organisation',
                    'organisation.organisationId = :organisationId',
                    {
                        organisationId: org,
                    }
                )
                .where(
                    'profile.profileId = :profileId',
                    {
                        profileId,
                    }
                )
                .getOne();
            if (!profile) {
                response.status(404).json({ msg: 'Profile not found' });
                return;
            }
            const { sampleId, resultType, result } = request.body.data.attributes;
            const repo = getRepository(Result);
            const resultEnt = await repo.save(repo.create({
                sampleId,
                type: resultType,
                profile,
                result,
            }));
            const { activateTime, resultId: id, } = resultEnt;
            response.status(201).json({
                data: {
                    id,
                    type: 'sample',
                    attributes: {
                        sampleId,
                        resultType,
                        activateTime,
                        result
                    },
                },
            });
        } catch (err) {
            logger.error(err.message);
            response.status(500).json({ msg: 'Something went wrong' });
        }
    }

};
