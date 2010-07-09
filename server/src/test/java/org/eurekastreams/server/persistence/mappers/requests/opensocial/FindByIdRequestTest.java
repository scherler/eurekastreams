/*
 * Copyright (c) 2009 Lockheed Martin Corporation
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
package org.eurekastreams.server.persistence.mappers.requests.opensocial;

import static org.junit.Assert.assertEquals;

import org.eurekastreams.server.persistence.mappers.requests.FindByIdRequest;
import org.junit.Test;

/**
 * Test for FindByIdRequest.
 *
 */
public class FindByIdRequestTest
{
    /**
     * userId.
     */
    private long id = 1L;
    
    /**
     * userId.
     */
    private String name = "Activity";
    
    /**
     * Test getters/constructor.
     */
    @Test
    public void testGetters()
    {
        FindByIdRequest sut = new FindByIdRequest(name, id);
        assertEquals(name, sut.getEntityName());
        assertEquals(id, sut.getEntityId());
    }

}
