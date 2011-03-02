/*
 * Copyright (c) 2010-2011 Lockheed Martin Corporation
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

import org.eurekastreams.server.domain.SystemSettings;
import org.eurekastreams.server.persistence.mappers.ReadMapper;
import org.eurekastreams.server.persistence.mappers.requests.MapperRequest;

/**
 * DB Mapper used for finding the system settings.
 */
public class FindSystemSettingsDbDomainMapperImpl extends ReadMapper<MapperRequest, SystemSettings>
{
    /**
     * HTML content template used on the site labeling line of the header.
     */
    private final String headerTemplate;

    /**
     * HTML content template used on the site labeling line of the footer.
     */
    private final String footerTemplate;

    /**
     * Constructor.
     * 
     * @param inHeaderTemplate
     *            HTML content template used on the site labeling line of the header.
     * @param inFooterTemplate
     *            HTML content template used on the site labeling line of the footer.
     */
    public FindSystemSettingsDbDomainMapperImpl(final String inHeaderTemplate, final String inFooterTemplate)
    {
        headerTemplate = inHeaderTemplate;
        footerTemplate = inFooterTemplate;
    }

    /**
     * Finds the system settings record.
     * 
     * @param inRequest
     *            The MapperRequest.
     * @return the requested domain entity.
     */
    @Override
    public SystemSettings execute(final MapperRequest inRequest)
    {
        Query q = getEntityManager().createQuery("from SystemSettings");
        SystemSettings settings = (SystemSettings) q.getSingleResult();

        String groupShortName = settings.getSupportStreamGroupShortName();

        if (groupShortName != null && !groupShortName.isEmpty())
        {
            q = getEntityManager().createQuery("select name from DomainGroup where shortName = :shortName")
                    .setParameter("shortName", groupShortName);
            String groupName = (String) q.getSingleResult();
            settings.setSupportStreamGroupDisplayName(groupName);
        }

        settings.setHeaderTemplate(headerTemplate);
        settings.setFooterTemplate(footerTemplate);

        return settings;
    }
}
