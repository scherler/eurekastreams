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
package org.eurekastreams.server.service.actions.strategies;

import javax.naming.NamingException;

import org.eurekastreams.server.persistence.PersonMapper;
import org.jmock.Expectations;
import org.jmock.integration.junit4.JUnit4Mockery;
import org.jmock.lib.legacy.ClassImposteriser;
import org.junit.Before;
import org.junit.Test;

/**
 * Tests the domain person lookup.
 */
public class DomainPersonLookupTest
{

    /**
     * Mocking context.
     */
    private final JUnit4Mockery context = new JUnit4Mockery()
    {
        {
            setImposteriser(ClassImposteriser.INSTANCE);
        }
    };

    /**
     * System under test.
     */
    private DomainPersonLookup sut;

    /**
     * Mock person mapper.
     */
    private PersonMapper mapper = context.mock(PersonMapper.class);

    /**
     * Setup text fixtures.
     */
    @Before
    public final void setUp()
    {
        sut = new DomainPersonLookup(mapper);
    }

    /**
     * Tests looking up users.
     *
     * @throws NamingException
     *             not expected
     */
    @Test
    public final void testLookup() throws NamingException
    {
        context.checking(new Expectations()
        {
            {
                oneOf(mapper).findPeopleByPrefix("searchString");
            }
        });

        sut.findPeople("searchString", 0);

    }
}
