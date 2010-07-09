/*
 * Copyright (c) 2009 Lockheed Martin Corporation
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
package org.eurekastreams.web.client.events;

/**
 * Gets fired when a widget request reinitializing the stream to the default.
 * 
 */
public final class StreamReinitializeRequestEvent
{
    /**
     * Private constructor.
     */
    private StreamReinitializeRequestEvent()
    {
    }

    /**
     * Gets an instance of the event.
     * 
     * @return the event.
     */
    public static StreamReinitializeRequestEvent getEvent()
    {
        return new StreamReinitializeRequestEvent();
    }

}
