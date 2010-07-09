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
package org.eurekastreams.server.service.actions.strategies;

import java.util.List;

import org.eurekastreams.commons.actions.context.Principal;
import org.eurekastreams.commons.server.UserActionRequest;

/**
 * Strategy interface for an action to get {@link UserActionRequest}s to update the cache.
 */
public interface CacheUpdater
{
    /**
     * Return list of UserActionRequests to update the cache.
     * 
     * @param inUser
     *            the {@link Principal} executing the operation.
     * @param inEntityId
     *            The entity id of the entity being updated.
     * @return list of UserActionRequests.
     */
    List<UserActionRequest> getUpdateCacheRequests(final Principal inUser, final Long inEntityId);
}
