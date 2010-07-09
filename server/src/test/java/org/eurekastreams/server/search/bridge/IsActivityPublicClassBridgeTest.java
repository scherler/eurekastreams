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
package org.eurekastreams.server.search.bridge;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.eurekastreams.server.domain.Person;
import org.eurekastreams.server.domain.stream.Activity;
import org.junit.Test;

/**
 * Test fixture for IsActivityPublicClassBridge.
 */
public class IsActivityPublicClassBridgeTest
{
    /**
     * System under test.
     */
    private IsActivityPublicClassBridge sut = new IsActivityPublicClassBridge();

    /**
     * Test objectToString when passed null input.
     */
    @Test
    public void testObjectToStringNullInput()
    {
        assertNull(sut.objectToString(null));
    }

    /**
     * Test objectToString when passed an invalid type.
     */
    @Test
    public void testObjectToStringWrongType()
    {
        assertNull(sut.objectToString(new Person()));
    }

    /**
     * Test objectToString when passed a public group scope.
     */
    @Test
    public void testObjectToStringPublic()
    {
        final Activity activity = new Activity();
        activity.setIsDestinationStreamPublic(true);

        assertEquals("t", sut.objectToString(activity));
    }

    /**
     * Test objectToString when passed a public group scope.
     */
    @Test
    public void testObjectToStringNotPublic()
    {
        final Activity activity = new Activity();
        activity.setIsDestinationStreamPublic(false);

        assertEquals("f", sut.objectToString(activity));
    }

}
