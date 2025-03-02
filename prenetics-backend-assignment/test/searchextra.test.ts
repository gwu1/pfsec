import { expect } from 'chai';
import * as sinon from 'sinon';
import { EntityManager } from 'typeorm';
import { search } from '../src/component/search';
import { Organisation } from '../src/entity/organisation';

describe('search.ts Unit Tests extra fields', () => {
    let managerStub: Partial<EntityManager>;

    beforeEach(() => {
        // Mock EntityManager
        managerStub = {
            createQueryBuilder: sinon.stub().returns({
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
                            type: 'PCR', // Extra field for Circle
                            profile: {
                                profileId: '12345', // Extra field for Circle
                            },
                        },
                    ],
                    1, // Total count
                ]),
            }),
        };
    });

    it('should include extra fields for Circle organization', async () => {
        // Mock Circle organization
        const circleOrganisation: Organisation = {
            organisationId: '123', name: 'Circle'
        } as Organisation;

        // Call the search function
        const result = await search(managerStub as EntityManager, circleOrganisation, {});

        // Assertions
        expect(result.data[0].attributes).to.have.property('resultType', 'PCR'); // Check resultType
        expect(result.data[0].attributes).to.have.property('patientId', '12345'); // Check patientId
    });

    it('should not include extra fields for non-Circle organizations', async () => {
        // Mock non-Circle organization
        const nonCircleOrganisation: Organisation = {
            organisationId: '456', name: 'non-circle'
        } as Organisation;

        // Call the search function
        const result = await search(managerStub as EntityManager, nonCircleOrganisation, {});

        // Assertions
        expect(result.data[0].attributes).to.not.have.property('resultType'); // Ensure resultType is not present
        expect(result.data[0].attributes).to.not.have.property('patientId'); // Ensure patientId is not present
    });
});