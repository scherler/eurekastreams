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
package org.eurekastreams.server.action.execution.profile;

import org.eurekastreams.commons.actions.context.Principal;
import org.eurekastreams.commons.actions.context.PrincipalActionContext;
import org.eurekastreams.server.persistence.JobMapper;
import org.jmock.Expectations;
import org.jmock.Mockery;
import org.jmock.integration.junit4.JUnit4Mockery;
import org.jmock.lib.legacy.ClassImposteriser;
import org.junit.Test;

/**
 * Delete employment test.
 *
 */
public class DeleteEmploymentExecutionTest
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
     * Mapper mock.
     */
    private JobMapper mapper = context.mock(JobMapper.class);

    /**
     * System under test.
     */
    private DeleteEmploymentExecution sut = new DeleteEmploymentExecution(mapper);


    /**
     * Mocked instance of the principal object.
     */
    private PrincipalActionContext actionContext = context.mock(PrincipalActionContext.class);

    /**
     * Principal mock.
     */
    private Principal principal = context.mock(Principal.class);

    /**
     * Test.
     */
    @Test
    public void execute()
    {
        final Long params = 1L;

        context.checking(new Expectations()
        {
            {
                allowing(actionContext).getParams();
                will(returnValue(params));

                allowing(actionContext).getPrincipal();
                will(returnValue(principal));

                allowing(principal).getOpenSocialId();
                will(returnValue("opensocial"));

                oneOf(mapper).delete(1L);
                oneOf(mapper).flush("opensocial");
            }
        });


        sut.execute(actionContext);
        context.assertIsSatisfied();
    }
}
