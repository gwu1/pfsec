import { expect } from 'chai';
import sinon from 'sinon';
import { search } from '../src/component/search';
import { EntityManager } from 'typeorm';
import { Organisation } from '../src/entity/organisation';

describe('search function', () => {
    let mockManager: sinon.SinonStubbedInstance<EntityManager>;
    let organisation: Organisation;

    beforeEach(() => {
        mockManager = sinon.createStubInstance(EntityManager);
        organisation = { organisationId: '12345', name: 'Test Org' } as Organisation;
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return all results when no page parameter is provided', async () => {
        const mockResults = [
            { resultId: '1', sampleId: '123', activateTime: '2021-01-01', resultTime: '2021-01-02', result: 'positive', profile: { profileId: '10' } },
            { resultId: '2', sampleId: '124', activateTime: '2021-01-03', resultTime: '2021-01-04', result: 'negative', profile: { profileId: '11' } },
        ];

        // Mocking the query builder to return all results
        mockManager.createQueryBuilder.returns({
            innerJoinAndSelect: sinon.stub().returnsThis(),
            getManyAndCount: sinon.stub().resolves([mockResults, mockResults.length]),
        } as any);

        const query = {}; // No page parameter
        const response = await search(mockManager as any, organisation, query);

        expect(response.meta.currentPage).to.be.null;
        expect(response.meta.totalPages).to.be.null;
        expect(response.data.length).to.equal(mockResults.length);
    });

    it('should return paginated results when page parameter is provided', async () => {
            const mockResultsPage2 = [
                { resultId: '3', sampleId: '125', activateTime: '2021-01-05', resultTime: '2021-01-06', result: 'positive', profile: { profileId: '12' } },
                { resultId: '4', sampleId: '126', activateTime: '2021-01-07', resultTime: '2021-01-08', result: 'negative', profile: { profileId: '13' } },
            ];

            // Mocking the query builder
            mockManager.createQueryBuilder.returns({
                innerJoinAndSelect: sinon.stub().returnsThis(),
                take: sinon.stub().returnsThis(),
                skip: sinon.stub().returnsThis(),
                getMany: sinon.stub().resolves(mockResultsPage2),
                getCount: sinon.stub().resolves(30), // Total results count
            } as any);

            const query = { page: '2' }; // Request for page 2
            const response = await search(mockManager as any, organisation, query);

            expect(response.meta.currentPage).to.equal(2);
            expect(response.meta.totalPages).to.equal(2);
            expect(response.data.length).to.equal(mockResultsPage2.length);
        });

    it('should return remaining items on the last page', async () => {
        const totalResults = 36; // Example total
        const lastPageResults = [
            { resultId: '35', sampleId: '127', activateTime: '2021-01-09', resultTime: '2021-01-10', result: 'positive', profile: { profileId: '14' } },
            { resultId: '36', sampleId: '128', activateTime: '2021-01-11', resultTime: '2021-01-12', result: 'negative', profile: { profileId: '15' } },
        ];

        // Mocking the query builder
        mockManager.createQueryBuilder.returns({
            innerJoinAndSelect: sinon.stub().returnsThis(),
            take: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            getMany: sinon.stub().resolves(lastPageResults),
            getCount: sinon.stub().resolves(totalResults), // Total results count
        } as any);

        const query = { page: '3' }; // Request for the last page
        const response = await search(mockManager as any, organisation, query);

        expect(response.meta.currentPage).to.equal(3);
        expect(response.meta.totalPages).to.equal(3);
        expect(response.meta.currentPageItems).to.equal(6); // Remaining items
        expect(response.data.length).to.equal(lastPageResults.length);
    });
});