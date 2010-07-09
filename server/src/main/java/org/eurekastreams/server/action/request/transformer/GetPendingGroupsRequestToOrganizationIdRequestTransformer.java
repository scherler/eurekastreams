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
package org.eurekastreams.server.action.request.transformer;

import java.io.Serializable;

import org.eurekastreams.commons.actions.context.ActionContext;
import org.eurekastreams.server.action.request.profile.GetPendingGroupsRequest;
import org.eurekastreams.server.persistence.mappers.stream.GetOrganizationsByShortNames;

/**
 * Gets an org id from the request.
 */
public class GetPendingGroupsRequestToOrganizationIdRequestTransformer implements RequestTransformer
{
    /** For getting org id from shortname. */
    // TODO: Overkill: don't actually need the whole org, just the id.
    private GetOrganizationsByShortNames orgMapper;

    /**
     * Constructor.
     *
     * @param inOrgMapper
     *            For getting org id from shortname.
     */
    public GetPendingGroupsRequestToOrganizationIdRequestTransformer(final GetOrganizationsByShortNames inOrgMapper)
    {
        orgMapper = inOrgMapper;
    }

    /**
     * Extracts the org id from the request.
     *
     * @param inActionContext
     *            action context.
     * @return The org id.
     */
    @Override
    public Serializable transform(final ActionContext inActionContext)
    {
        String orgName = ((GetPendingGroupsRequest) inActionContext.getParams()).getOrganizationShortName();

        // the authorizer expects a string and converts it back to a long, so we have to make it happy
        return Long.toString(orgMapper.fetchId(orgName));
    }
}
