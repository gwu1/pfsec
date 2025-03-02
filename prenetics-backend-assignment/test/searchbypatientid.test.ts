import { expect } from 'chai';
import * as sinon from 'sinon';
import { EntityManager } from 'typeorm';
import { search } from '../src/component/search';
import { Organisation } from '../src/entity/organisation';

describe('search function - patientId mapping and search', () => {
    let managerStub: Partial<EntityManager>;
    let createQueryBuilderStub: any;

    beforeEach(() => {
        // Mock QueryBuilder methods
        createQueryBuilderStub = {
            innerJoinAndSelect: sinon.stub().returnsThis(),
            andWhere: sinon.stub().returnsThis(),
            getManyAndCount: sinon.stub().resolves([
                [
                    {
                        resultId: 'result-1',
                        result: 'positive',
                        sampleId: 'sample-123',
                        activateTime: '2023-01-01T00:00:00.000Z',
                        resultTime: '2023-01-02T00:00:00.000Z',
                        type: 'PCR',
                        profile: {
                            profileId: '852',
                            name: 'John Doe',
                        },
                    },
                ],
                1, // Total count
            ]),
        };

        // Mock EntityManager
        managerStub = {
            createQueryBuilder: sinon.stub().returns(createQueryBuilderStub),
        };
    });

    it('should search by patientId and expose profileId as patientId', async () => {
        const organisation: Organisation = { organisationId: '123', name: 'Circle' } as Organisation;

        // Call the search function with patientId
        const result = await search(managerStub as EntityManager, organisation, { patientId: '852' });

        // Verify that the query was built correctly
        expect(createQueryBuilderStub.andWhere.calledWith('profile.profileId = :patientId', { patientId: '852' })).to.be.true;

        // Verify the response includes the mapped patientId
        console.log(result.data[0].attributes)
        expect(result.data[0].attributes).to.have.property('patientId', '852');
        expect(result.data[0].attributes).to.have.property('resultType', 'PCR'); // Extra field for Circle
    });

    it('should not include resultType and patientId for non-Circle organizations', async () => {
        const organisation: Organisation = { organisationId: '456', name: 'non-Circle' } as Organisation;

        // Call the search function without patientId for a non-Circle organization
        const result = await search(managerStub as EntityManager, organisation, {});

        // Verify the response does not include resultType or patientId
        expect(result.data[0].attributes).to.not.have.property('resultType');
        expect(result.data[0].attributes).to.not.have.property('patientId', '853');
    });
});