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
package org.eurekastreams.server.persistence.mappers.cache;

import java.util.List;

/**
 * Interface for creating Followed list of activity ids.
 *
 */
public interface FollowedActivityIdsLoader
{
    /**
     * Returns list of Activity ids a person is following sorted desc. by id.
     * @param inPersonId Id of the person to get activities for.
     * @param inMaxResults Max number of activity ids to return
     * @return List of Activity ids a person is following sorted desc. by id.
     */
    List<Long> getFollowedActivityIds(final long inPersonId, final int inMaxResults);

}
