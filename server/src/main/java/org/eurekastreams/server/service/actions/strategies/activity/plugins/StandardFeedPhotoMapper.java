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
package org.eurekastreams.server.service.actions.strategies.activity.plugins;

import java.util.HashMap;

import org.eurekastreams.server.domain.stream.Activity;
import org.eurekastreams.server.domain.stream.BaseObjectType;
import org.eurekastreams.server.domain.stream.plugins.Feed;

import com.sun.syndication.feed.module.mediarss.MediaModule;
import com.sun.syndication.feed.module.mediarss.MediaModuleImpl;
import com.sun.syndication.feed.synd.SyndEntry;
import com.sun.syndication.feed.synd.SyndLinkImpl;

/**
 * Map entries to photos.
 */
public class StandardFeedPhotoMapper implements FeedObjectActivityBuilder
{
    /**
     * Gets the base object.
     *
     * @param entry
     *            the entry.
     * @return the object.
     */
    protected HashMap<String, String> getBaseObject(final SyndEntry entry)
    {
        HashMap<String, String> object = new HashMap<String, String>();
        object.put("title", entry.getTitle());

        for (Object linkObj : entry.getLinks())
        {
            SyndLinkImpl link = (SyndLinkImpl) linkObj;
            if (link.getRel().equals("enclosure"))
            {
                object.put("largerImage", link.getHref());
            }
            if (link.getRel().equals("alternate"))
            {
                object.put("imagePageURL", link.getHref());
            }
        }

        MediaModule media = (MediaModuleImpl) entry.getModule(MediaModule.URI);
        if (media != null && media.getMetadata().getThumbnail().length > 0)
        {
            object.put("thumbnail", media.getMetadata().getThumbnail()[0].getUrl().toString());
        }

        if (entry.getDescription() != null)
        {
            object.put("description", entry.getDescription().getValue());
        }

        return object;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void build(final Feed inFeed, final SyndEntry inEntry, final Activity inActivity)
    {
        inActivity.setBaseObjectType(BaseObjectType.PHOTO);
        inActivity.setBaseObject(getBaseObject(inEntry));
    }
}
