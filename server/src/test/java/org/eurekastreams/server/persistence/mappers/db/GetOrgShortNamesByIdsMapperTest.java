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
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.eurekastreams.server.persistence.mappers.MapperTest;
import org.junit.Test;

/**
 * Test fixture for GetOrgShortNamesByIdsMapper.
 */
public class GetOrgShortNamesByIdsMapperTest extends MapperTest
{
    /**
     * Test execute with no inputs.
     */
    @Test
    public void testExecuteNoContents()
    {
        List<Long> orgIds = new ArrayList<Long>();

        GetOrgShortNamesByIdsMapper sut = new GetOrgShortNamesByIdsMapper();
        sut.setEntityManager(getEntityManager());
        List<String> shortNames = sut.execute(orgIds);

        assertEquals(0, shortNames.size());
    }

    /**
     * Test execute.
     */
    @Test
    public void testExecute()
    {
        List<Long> orgIds = new ArrayList<Long>();
        orgIds.add(5L);
        orgIds.add(6L);
        orgIds.add(1L); // dne

        GetOrgShortNamesByIdsMapper sut = new GetOrgShortNamesByIdsMapper();
        sut.setEntityManager(getEntityManager());
        List<String> shortNames = sut.execute(orgIds);

        assertEquals(2, shortNames.size());
        assertTrue(shortNames.contains("tstorgname"));
        assertTrue(shortNames.contains("child1orgname"));
    }
}
