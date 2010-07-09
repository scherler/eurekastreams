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

import javax.persistence.Query;

import org.eurekastreams.server.domain.NotificationFilterPreference;
import org.eurekastreams.server.domain.NotificationFilterPreferenceDTO;
import org.eurekastreams.server.domain.Person;
import org.eurekastreams.server.persistence.mappers.BaseArgDomainMapper;
import org.eurekastreams.server.persistence.mappers.requests.SetUserNotificationFilterPreferencesRequest;

/**
 * Sets a user's notification filter preferences.
 */
public class SetUserNotificationFilterPreferences extends
        BaseArgDomainMapper<SetUserNotificationFilterPreferencesRequest, Boolean>
{
    /**
     * {@inheritDoc}
     */
    @Override
    public Boolean execute(final SetUserNotificationFilterPreferencesRequest inRequest)
    {
        // delete existing preferences
        Query q =
                getEntityManager().createQuery("DELETE FROM NotificationFilterPreference where personId=:personId");
        q.setParameter("personId", inRequest.getPersonId());
        q.executeUpdate();

        // get dummy Person object
        Person user = (Person) getHibernateSession().load(Person.class, inRequest.getPersonId());

        // add new preferences
        for (NotificationFilterPreferenceDTO dto : inRequest.getPrefList())
        {
            NotificationFilterPreference entity = new NotificationFilterPreference();
            entity.setPerson(user);
            entity.setNotificationCategory(dto.getNotificationCategory());
            entity.setNotifierType(dto.getNotifierType());
            getEntityManager().persist(entity);
        }

        return null;
    }

}
