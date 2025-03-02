import { expect } from 'chai';
import * as sinon from 'sinon';
import { search } from '../src/component/search';
import { EntityManager } from 'typeorm';
import { Organisation } from '../src/entity/organisation';
import { Request } from 'express';

describe('search.ts Unit Tests', () => {
    let managerStub: sinon.SinonStubbedInstance<EntityManager>;
    const organisation: Organisation = {
        organisationId: 'b613f220-b31d-461f-ab42-3b974283ab76', // Mock organisation object
    } as Organisation;

    beforeEach(() => {
        // Mock the EntityManager
        managerStub = sinon.createStubInstance(EntityManager) as unknown as sinon.SinonStubbedInstance<EntityManager>;
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return all results when no page parameter is provided', async () => {
        // Mock the query builder and its methods
        const queryBuilderStub = {
            innerJoinAndSelect: sinon.stub().returnsThis(),
            andWhere: sinon.stub().returnsThis(),
            getManyAndCount: sinon.stub().resolves([
                [
                    {
                        resultId: 'result-1',
                        result: 'positive',
                        sampleId: 'sample-123',
                        activateTime: '2023-01-01',
                        resultTime: '2023-01-02',
                        profile: {
                            profileId: 'profile-1',
                            name: 'John Doe',
                        },
                    },
                ],
                1, // Total count
            ]),
        };

        // Mock createQueryBuilder
        managerStub.createQueryBuilder.returns(queryBuilderStub as any);

        const params: Request['query'] = {}; // No filters or pagination
        const result = await search(managerStub as unknown as EntityManager, organisation, params);

        // Assertions
        expect(queryBuilderStub.innerJoinAndSelect.calledTwice).to.be.true; // Ensure joins were called
        expect(queryBuilderStub.getManyAndCount.calledOnce).to.be.true; // Ensure results were fetched
        expect(result).to.deep.equal({
            meta: {
                total: 1,
                currentPage: null,
                totalPages: null,
            },
            data: [
                {
                    id: 'result-1',
                    type: 'sample',
                    attributes: {
                        result: 'positive',
                        sampleId: 'sample-123',
                        activateTime: '2023-01-01',
                        resultTime: '2023-01-02',
                    },
                    relationships: {
                        profile: {
                            data: {
                                type: 'profile',
                                id: 'profile-1',
                            },
                        },
                    },
                },
            ],
        });
    });

    it('should return paginated results when page parameter is provided', async () => {
        // Mock the query builder and its methods
        const queryBuilderStub = {
            innerJoinAndSelect: sinon.stub().returnsThis(),
            andWhere: sinon.stub().returnsThis(),
            getCount: sinon.stub().resolves(25), // Total count of results
            take: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            getMany: sinon.stub().resolves([
                {
                    resultId: 'result-2',
                    result: 'negative',
                    sampleId: 'sample-456',
                    activateTime: '2023-01-01',
                    resultTime: '2023-01-02',
                    profile: {
                        profileId: 'profile-2',
                        name: 'Jane Doe',
                    },
                },
            ]),
        };

        // Mock createQueryBuilder
        managerStub.createQueryBuilder.returns(queryBuilderStub as any);

        const params: Request['query'] = { page: '2' }; // Page 2
        const result = await search(managerStub as unknown as EntityManager, organisation, params);

        // Assertions
        expect(queryBuilderStub.innerJoinAndSelect.calledTwice).to.be.true; // Ensure joins were called
        expect(queryBuilderStub.getCount.calledOnce).to.be.true; // Ensure total count was fetched
        expect(queryBuilderStub.take.calledOnceWith(15)).to.be.true; // Ensure limit was set
        expect(queryBuilderStub.skip.calledOnceWith(15)).to.be.true; // Ensure offset was set
        expect(result).to.deep.equal({
            meta: {
                total: 25,
                currentPage: 2,
                totalPages: 2,
                currentPageItems: 10, // Last page items (25 % 15 = 10)
            },
            data: [
                {
                    id: 'result-2',
                    type: 'sample',
                    attributes: {
                        result: 'negative',
                        sampleId: 'sample-456',
                        activateTime: '2023-01-01',
                        resultTime: '2023-01-02',
                    },
                    relationships: {
                        profile: {
                            data: {
                                type: 'profile',
                                id: 'profile-2',
                            },
                        },
                    },
                },
            ],
        });
    });

    it('should return remaining items on the last page', async () => {
        // Mock the query builder and its methods
        const queryBuilderStub = {
            innerJoinAndSelect: sinon.stub().returnsThis(),
            andWhere: sinon.stub().returnsThis(),
            getCount: sinon.stub().resolves(37), // Total count of results
            take: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            getMany: sinon.stub().resolves([
                {
                    resultId: 'result-36',
                    result: 'positive',
                    sampleId: 'sample-36',
                    activateTime: '2023-01-01',
                    resultTime: '2023-01-02',
                    profile: {
                        profileId: 'profile-36',
                        name: 'Last Page Item 1',
                    },
                },
                {
                    resultId: 'result-37',
                    result: 'negative',
                    sampleId: 'sample-37',
                    activateTime: '2023-01-01',
                    resultTime: '2023-01-02',
                    profile: {
                        profileId: 'profile-37',
                        name: 'Last Page Item 2',
                    },
                },
            ]),
        };

        // Mock createQueryBuilder
        managerStub.createQueryBuilder.returns(queryBuilderStub as any);

        const params: Request['query'] = { page: '3' }; // Requesting the last page
        const result = await search(managerStub as unknown as EntityManager, organisation, params);

        // Assertions
        expect(queryBuilderStub.innerJoinAndSelect.calledTwice).to.be.true; // Ensure joins were called
        expect(queryBuilderStub.getCount.calledOnce).to.be.true; // Ensure total count was fetched
        expect(queryBuilderStub.take.calledOnceWith(15)).to.be.true; // Ensure limit was set
        expect(queryBuilderStub.skip.calledOnceWith(30)).to.be.true; // Offset for page 3 (15 * (3 - 1))

        // Ensure the correct meta and data structure is returned
        expect(result).to.deep.equal({
            meta: {
                total: 37, // Total items
                currentPage: 3, // Last page
                totalPages: 3, // Total pages
                currentPageItems: 7, // Remaining items on the last page
            },
            data: [
                {
                    id: 'result-36',
                    type: 'sample',
                    attributes: {
                        result: 'positive',
                        sampleId: 'sample-36',
                        activateTime: '2023-01-01',
                        resultTime: '2023-01-02',
                    },
                    relationships: {
                        profile: {
                            data: {
                                type: 'profile',
                                id: 'profile-36',
                            },
                        },
                    },
                },
                {
                    id: 'result-37',
                    type: 'sample',
                    attributes: {
                        result: 'negative',
                        sampleId: 'sample-37',
                        activateTime: '2023-01-01',
                        resultTime: '2023-01-02',
                    },
                    relationships: {
                        profile: {
                            data: {
                                type: 'profile',
                                id: 'profile-37',
                            },
                        },
                    },
                },
            ],
        });
    });

    it('should add filters for patientName, sampleBarcode, activationDate, and resultDate', async () => {
        // Mock the query builder and its methods
        const queryBuilderStub = {
            innerJoinAndSelect: sinon.stub().returnsThis(),
            andWhere: sinon.stub().returnsThis(),
            getManyAndCount: sinon.stub().resolves([[], 0]),
        };

        // Mock createQueryBuilder
        managerStub.createQueryBuilder.returns(queryBuilderStub as any);

        // Provide all 4 filters
        const params: Request['query'] = {
            patientName: 'John',
            sampleBarcode: 'sample-123',
            activationDate: '2023-01-01',
            resultDate: '2023-01-02',
        };
        await search(managerStub as unknown as EntityManager, organisation, params);

        // Assertions
        expect(queryBuilderStub.andWhere.callCount).to.equal(4); // Ensure all 4 filters are applied

        // First filter: patientName
        expect(queryBuilderStub.andWhere.getCall(0).args[0]).to.equal('profile.name ILIKE :patientName');
        expect(queryBuilderStub.andWhere.getCall(0).args[1]).to.deep.equal({ patientName: '%John%' });

        // Second filter: sampleBarcode
        expect(queryBuilderStub.andWhere.getCall(1).args[0]).to.equal('result.sampleId ILIKE :sampleBarcode');
        expect(queryBuilderStub.andWhere.getCall(1).args[1]).to.deep.equal({ sampleBarcode: '%sample-123%' });

        // Third filter: activationDate
        expect(queryBuilderStub.andWhere.getCall(2).args[0]).to.equal('DATE(result.activateTime) = :activationDate');
        expect(queryBuilderStub.andWhere.getCall(2).args[1]).to.deep.equal({ activationDate: '2023-01-01' });

        // Fourth filter: resultDate
        expect(queryBuilderStub.andWhere.getCall(3).args[0]).to.equal('DATE(result.resultTime) = :resultDate');
        expect(queryBuilderStub.andWhere.getCall(3).args[1]).to.deep.equal({ resultDate: '2023-01-02' });
    });
});

