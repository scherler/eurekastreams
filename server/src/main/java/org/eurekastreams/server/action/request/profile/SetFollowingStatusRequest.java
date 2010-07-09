/*
 * Copyright (c) 2009-2010 Lockheed Martin Corporation
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
package org.eurekastreams.server.action.request.profile;

import java.io.Serializable;

import org.eurekastreams.server.domain.EntityType;
import org.eurekastreams.server.domain.Follower;

/**
 * Request class for SetFollowingStatus action.
 *
 */
public class SetFollowingStatusRequest implements Serializable
{
    /**
     * Serialization id.
     */
    private static final long serialVersionUID = -4514743000229301011L;

    /**
     * Local instance of the follower Unique id.
     */
    private String followerUniqueId;

    /**
     * Local instance of the target unique id.
     */
    private String targetUniqueId;

    /**
     * Local instance of the target entity type.
     */
    private EntityType targetEntityType;

    /**
     * Local instance of the OpenSocial request flag.
     */
    private boolean openSocialRequest;

    /**
     * Local instance of the FollowerStatus determining what type of SetFollowingStatus request the action is handling.
     */
    private Follower.FollowerStatus followerStatus;

    /**
     * Empty constructor for GWT.
     */
    @SuppressWarnings("unused")
    private SetFollowingStatusRequest()
    {
        // Empty for GWT.
    }

    /**
     * Constructor for the Request object.
     *
     * @param inFollowerUniqueId
     *            - unique id of the follower.
     * @param inTargetUniqueId
     *            - unique id of the target that the follower is following.
     * @param inTargetEntityType
     *            - Type of entity for the target.
     * @param inOpenSocialRequest
     *            - flag indicating whether this request represents an OpenSocial entity.
     * @param inFollowerStatus
     *            - status of the following relationship being requested.
     */
    public SetFollowingStatusRequest(final String inFollowerUniqueId, final String inTargetUniqueId,
            final EntityType inTargetEntityType, final boolean inOpenSocialRequest,
            final Follower.FollowerStatus inFollowerStatus)
    {
        followerUniqueId = inFollowerUniqueId;
        targetUniqueId = inTargetUniqueId;
        targetEntityType = inTargetEntityType;
        openSocialRequest = inOpenSocialRequest;
        followerStatus = inFollowerStatus;
    }

    /**
     * Getter.
     *
     * @return - instance of unique id of the follower.
     */
    public String getFollowerUniqueId()
    {
        return followerUniqueId;
    }

    /**
     * Getter.
     *
     * @return - instance of unique id of the target being followed.
     */
    public String getTargetUniqueId()
    {
        return targetUniqueId;
    }

    /**
     * Getter.
     *
     * @return - instance of the entity type of the target being followed.
     */
    public EntityType getTargetEntityType()
    {
        return targetEntityType;
    }

    /**
     * Getter.
     *
     * @return - instance of the flag indicating whether or not this is an opensocial request.
     */
    public boolean getOpenSocialRequest()
    {
        return openSocialRequest;
    }

    /**
     * Getter.
     *
     * @return - instance of the follower status.
     */
    public Follower.FollowerStatus getFollowerStatus()
    {
        return followerStatus;
    }
}
