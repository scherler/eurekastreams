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

import java.util.ArrayList;
import java.util.List;

import org.eurekastreams.server.persistence.mappers.BaseArgDomainMapper;
import org.eurekastreams.server.persistence.mappers.DomainMapper;

/**
 * Get activities from the database posted to the input stream scope id.
 */
public class BulkActivityStreamsDbMapper extends BaseArgDomainMapper<List<Long>, List<List<Long>>> implements
        DomainMapper<List<Long>, List<List<Long>>>
{
    /**
     * Max items to return.
     */
    private int maxItems = 0;

    /**
     * Set the max items to return.
     *
     * @param inMaxItems
     *            the max items.
     */
    public void setMaxItems(final int inMaxItems)
    {
        maxItems = inMaxItems;
    }

    /**
     * Get activities from the database posted to the input stream scope id.
     *
     * @param inRequest
     *            list of stream scope ids to find activity posted to
     * @return a list of lists representing activities posted to stream scopes represented by their input ids
     */
    @SuppressWarnings("unchecked")
    public List<List<Long>> execute(final List<Long> inRequest)
    {
        List<List<Long>> results = new ArrayList<List<Long>>();

        for (Long id : inRequest)
        {
            String query = "SELECT id FROM Activity WHERE recipientStreamScope.id = :streamId ORDER BY id DESC";

            results.add(getEntityManager().createQuery(query).setParameter("streamId", id).setMaxResults(maxItems)
                    .getResultList());
        }

        return results;
    }

}
