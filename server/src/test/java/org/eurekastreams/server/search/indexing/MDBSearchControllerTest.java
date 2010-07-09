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
package org.eurekastreams.server.search.indexing;

import static org.junit.Assert.assertEquals;

import javax.persistence.EntityManager;

import org.hibernate.Session;
import org.jmock.Expectations;
import org.jmock.Mockery;
import org.jmock.integration.junit4.JUnit4Mockery;
import org.jmock.lib.legacy.ClassImposteriser;
import org.junit.Test;

/**
 * Test fixture for MDBSearchController.
 */
public class MDBSearchControllerTest
{
    /**
     * Context for building mock objects.
     */
    private final Mockery context = new JUnit4Mockery()
    {
        {
            setImposteriser(ClassImposteriser.INSTANCE);
        }
    };

    /**
     * Test getting the session from EntityManager.
     */
    @Test
    public void testSession()
    {
        final EntityManager em = context.mock(EntityManager.class);
        final Session session = context.mock(Session.class);

        context.checking(new Expectations()
        {
            {
                oneOf(em).getDelegate();
                will(returnValue(session));
            }
        });

        MDBSearchController sut = new MDBSearchController();
        sut.setEntityManager(em);
        assertEquals(session, sut.getSession());
    }
}
