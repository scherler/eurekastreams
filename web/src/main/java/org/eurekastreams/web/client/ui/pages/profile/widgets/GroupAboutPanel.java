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
package org.eurekastreams.web.client.ui.pages.profile.widgets;

import org.eurekastreams.server.domain.EntityType;
import org.eurekastreams.web.client.ui.common.avatar.AvatarWidget;

import com.google.gwt.user.client.ui.Anchor;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.Label;

/**
 * Displays an Organization's title, website, and mission.
 */
public class GroupAboutPanel extends FlowPanel
{
    /**
     * The Follow/Stop Following button.
     */
    FollowPanel follow;

    /**
     * Constructor.
     * 
     * @param shortName
     *            the organization being described.
     */
    public GroupAboutPanel(final String shortName)
    {
        follow = new FollowPanel(shortName, EntityType.GROUP);
    }

    /**
     * Sets the group.
     * 
     * @param inName
     *            Name.
     * @param inEntityId
     *            id.
     * @param inAvatarId
     *            Avatar id.
     * @param inUrl
     *            url.
     * @param inDescription
     *            description.
     */
    public void setGroup(final String inName, final long inEntityId, final String inAvatarId, final String inUrl,
            final String inDescription)
    {
        this.clear();
        AvatarWidget photo = new AvatarWidget(inEntityId, inAvatarId, EntityType.ORGANIZATION, //
                AvatarWidget.Size.Normal);
        photo.addStyleName("profile-photo");
        this.add(photo);

        this.add(follow);

        Label title = new Label(inName);
        title.addStyleName("profile-org-title");
        this.add(title);

        Anchor url = new Anchor("Website", inUrl, "_NEW");
        url.addStyleName("profile-website");
        if (inUrl == null)
        {
            url.addStyleName("no-value");
        }
        this.add(url);

        if (inDescription != null && !inDescription.equals(""))
        {
            Label subheader = new Label("");
            subheader.addStyleName("profile-subheader");
            this.add(subheader);

            Label mission = new Label(inDescription);
            mission.addStyleName("profile-mission");
            this.add(mission);
        }
    }

}
