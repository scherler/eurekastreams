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

import java.util.Date;

import javax.persistence.Query;

import org.eurekastreams.server.persistence.mappers.BaseDomainMapper;

/**
 * This mapper deletes all application alert rows older than a given date.
 */
public class DeleteApplicationAlertsByDate extends BaseDomainMapper
{
    /**
     * Deletes alerts older than startDate.
     * 
     * @param startDate
     *            Alerts with dates older than or equal to this will be removed.
     */
    public void execute(final Date startDate)
    {
        String q = "delete from ApplicationAlertNotification where notificationDate <= :startDate";
        Query query = getEntityManager().createQuery(q).setParameter("startDate", startDate);
        query.executeUpdate();
    }
}
