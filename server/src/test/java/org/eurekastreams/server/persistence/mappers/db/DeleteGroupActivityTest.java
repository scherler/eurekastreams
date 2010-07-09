/*
 * Copyright (c) 2010 Lockheed Martin Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.eurekastreams.server.persistence.mappers.db;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.eurekastreams.server.persistence.mappers.MapperTest;
import org.eurekastreams.server.persistence.mappers.requests.BulkActivityDeleteResponse;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Test for GroupActivityDelete class.
 * 
 */
public class DeleteGroupActivityTest extends MapperTest
{
    /**
     * System under test.
     */
    @Autowired
    private DeleteGroupActivity sut;

    /**
     * Group id used in test.
     */
    private Long groupId = 1L;

    /**
     * Group id for non-existent group used in test.
     */
    private final Long fakeGroupId = 100L;

    /**
     * Comment id from dataset.xml.
     */
    private final Long comment1Id = 9L;

    /**
     * Comment id from dataset.xml.
     */
    private final Long comment2Id = 10L;

    /**
     * Activity id from dataset.xml.
     */
    private final Long activityId = 6793L;

    /**
     * Test.
     */
    @Test
    public void testExecute()
    {
        // call sut.
        BulkActivityDeleteResponse response = sut.execute(groupId);

        // assert results are correct.
        assertTrue(response.getCommentIds().contains(comment1Id));
        assertTrue(response.getCommentIds().contains(comment2Id));
        assertTrue(response.getActivityIds().contains(activityId));
        assertNotNull(response.getPeopleWithStarredActivities());

        // assert that expected activity and comments are actually gone.
        assertEquals(0, getEntityManager().createQuery("From Activity WHERE id=:activityId").setParameter("activityId",
                activityId).getResultList().size());

        assertEquals(0, getEntityManager().createQuery("From Comment WHERE id=:commentId").setParameter("commentId",
                comment1Id).getResultList().size());

        assertEquals(0, getEntityManager().createQuery("From Comment WHERE id=:commentId").setParameter("commentId",
                comment2Id).getResultList().size());
    }

    /**
     * Test with non-existent group.
     */
    @Test
    public void testExecuteGroupGone()
    {
        // call sut.
        BulkActivityDeleteResponse response = sut.execute(fakeGroupId);

        // assert that result is emtpy.
        assertEquals(0, response.getCommentIds().size());
        assertEquals(0, response.getActivityIds().size());
        assertEquals(0, response.getPeopleWithStarredActivities().keySet().size());
    }
}
