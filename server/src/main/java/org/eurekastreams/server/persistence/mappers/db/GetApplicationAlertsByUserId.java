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

import java.util.List;

import javax.persistence.Query;

import org.eurekastreams.server.domain.ApplicationAlertNotification;
import org.eurekastreams.server.persistence.mappers.BaseDomainMapper;

/**
 * This mapper gets all application alerts for a given userId, up to a specified max count.
 */
public class GetApplicationAlertsByUserId extends BaseDomainMapper
{
    /**
     * Query database for application alerts for this user.
     * 
     * @param userId
     *            the user id.
     * @param count
     *            the max count of alerts to return.
     * @return the list of alerts for this user.
     */
    @SuppressWarnings("unchecked")
    public List<ApplicationAlertNotification> execute(final long userId, final int count)
    {
        String q = "from ApplicationAlertNotification where recipient.id = :userId order by notificationDate desc";

        Query query = getEntityManager().createQuery(q).setParameter("userId", userId);
        query.setMaxResults(count);
        return query.getResultList();
    }
}
