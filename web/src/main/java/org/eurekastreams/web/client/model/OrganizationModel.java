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
package org.eurekastreams.web.client.model;

import java.io.Serializable;
import java.util.HashMap;

import org.eurekastreams.server.search.modelview.OrganizationModelView;
import org.eurekastreams.web.client.events.data.AuthorizeUpdateOrganizationResponseEvent;
import org.eurekastreams.web.client.events.data.GotOrganizationModelViewInformationResponseEvent;
import org.eurekastreams.web.client.events.data.InsertedOrganizationResponseEvent;
import org.eurekastreams.web.client.events.data.UpdatedOrganizationResponseEvent;
import org.eurekastreams.web.client.ui.Session;

/**
 * Organization Model.
 * 
 */
public class OrganizationModel extends BaseModel implements Fetchable<String>,
        Insertable<HashMap<String, Serializable>>, Updateable<HashMap<String, Serializable>>, Authorizable<String>
{
    /**
     * Singleton.
     */
    private static OrganizationModel model = new OrganizationModel();

    /**
     * Gets the singleton.
     * 
     * @return the singleton.
     */
    public static OrganizationModel getInstance()
    {
        return model;
    }

    /**
     * {@inheritDoc}
     */
    public void authorize(final String request, final boolean useClientCacheIfAvailable)
    {
        super.callReadAction("authorizeUpdateOrganization", request, new OnSuccessCommand<Boolean>()
        {
            public void onSuccess(final Boolean response)
            {
                Session.getInstance().getEventBus().notifyObservers(
                        new AuthorizeUpdateOrganizationResponseEvent(response));
            }
        }, useClientCacheIfAvailable);
    }

    /**
     * {@inheritDoc}
     */
    public void insert(final HashMap<String, Serializable> request)
    {
        super.callWriteAction("createOrganization", request, new OnSuccessCommand<OrganizationModelView>()
        {
            public void onSuccess(final OrganizationModelView response)
            {
                Session.getInstance().getEventBus().notifyObservers(new InsertedOrganizationResponseEvent(response));
            }
        });
    }

    /**
     * {@inheritDoc}
     */
    public void fetch(final String request, final boolean useClientCacheIfAvailable)
    {
        super.callReadAction("getOrganizationModelView", request, new OnSuccessCommand<OrganizationModelView>()
        {
            public void onSuccess(final OrganizationModelView response)
            {
                Session.getInstance().getEventBus().notifyObservers(
                        new GotOrganizationModelViewInformationResponseEvent(response));
            }
        }, useClientCacheIfAvailable);
    }

    /**
     * {@inheritDoc}
     */
    public void update(final HashMap<String, Serializable> request)
    {
        super.callWriteAction("updateOrganization", request, new OnSuccessCommand<OrganizationModelView>()
        {
            public void onSuccess(final OrganizationModelView response)
            {
                Session.getInstance().getEventBus().notifyObservers(new UpdatedOrganizationResponseEvent(response));
            }
        });
    }

}
