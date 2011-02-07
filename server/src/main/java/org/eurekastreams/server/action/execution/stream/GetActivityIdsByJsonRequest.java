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
package org.eurekastreams.server.action.execution.stream;

import java.util.ArrayList;
import java.util.List;

import net.sf.json.JSONObject;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.eurekastreams.server.persistence.mappers.DomainMapper;
import org.eurekastreams.server.search.modelview.PersonModelView;
import org.eurekastreams.server.service.actions.strategies.activity.ListCollider;
import org.eurekastreams.server.service.actions.strategies.activity.datasources.DescendingOrderDataSource;
import org.eurekastreams.server.service.actions.strategies.activity.datasources.SortedDataSource;

/**
 * Get Activity IDs with a JSON request.
 */
public class GetActivityIdsByJsonRequest
{
    /**
     * Logger.
     */
    private Log log = LogFactory.getLog(GetActivityIdsByJsonRequest.class);

    /**
     * Data source that MUST provide results in descending order of ID.
     */
    private DescendingOrderDataSource descendingOrderdataSource;

    /**
     * Data source that MUST provide results in the order they will be given to the user.
     */
    private SortedDataSource sortedDataSource;

    /**
     * AND collider.
     */
    private ListCollider andCollider;

    /**
     * Security trimmer.
     */
    private ActivitySecurityTrimmer securityTrimmer;

    /**
     * Person mapper.
     */
    private DomainMapper<List<Long>, List<PersonModelView>> personMapper;

    /**
     * String to replace with user name.
     */
    private String userReplaceString;

    /**
     * Public constructor for AOP.
     */
    public GetActivityIdsByJsonRequest()
    {
    }

    /**
     * Default constructor.
     * 
     * @param inDescendingOrderdataSource
     *            the data sources to fetch the sorted descending data from.
     * @param inSortedDataSource
     *            the data sources to fetch the sorted data from.
     * @param inAndCollider
     *            the and collider to merge results.
     * @param inSecurityTrimmer
     *            the security trimmer;
     * @param inPersonMapper
     *            the person mapper.
     * @param inUserRelaceString
     *            the string to replace with the user id.
     */
    public GetActivityIdsByJsonRequest(final DescendingOrderDataSource inDescendingOrderdataSource,
            final SortedDataSource inSortedDataSource, final ListCollider inAndCollider,
            final ActivitySecurityTrimmer inSecurityTrimmer,
            final DomainMapper<List<Long>, List<PersonModelView>> inPersonMapper, final String inUserRelaceString)
    {
        descendingOrderdataSource = inDescendingOrderdataSource;
        sortedDataSource = inSortedDataSource;
        andCollider = inAndCollider;
        securityTrimmer = inSecurityTrimmer;
        personMapper = inPersonMapper;
        userReplaceString = inUserRelaceString;
    }

    /**
     * Get activity ids base on a request and user entity ID.
     * 
     * @param inRequest
     *            the request.
     * @param userEntityId
     *            the user entity ID.
     * @return the activity ids.
     */
    public List<Long> execute(final String inRequest, final Long userEntityId)
    {
        String request = inRequest;
        log.debug("Attempted to parse: " + inRequest);

        if (request.contains(userReplaceString))
        {
            List<Long> peopleIds = new ArrayList<Long>();
            peopleIds.add(userEntityId);
            request = request.replaceAll(userReplaceString, personMapper.execute(peopleIds).get(0).getAccountId());
        }

        final JSONObject jsonRequest = JSONObject.fromObject(request);

        int maxResults = 0;
        long minActivityId = 0;
        long maxActivityId = Long.MAX_VALUE;

        if (jsonRequest.containsKey("count"))
        {
            maxResults = jsonRequest.getInt("count");
        }
        if (jsonRequest.containsKey("minId"))
        {
            minActivityId = jsonRequest.getInt("minId");
        }
        if (jsonRequest.containsKey("maxId"))
        {
            maxActivityId = jsonRequest.getLong("maxId");
        }

        // used for paging, this is the next activity in the list to add to the
        // current page
        int startingIndex = 0;

        // the list of activities to return
        List<Long> results = new ArrayList<Long>();

        List<Long> allKeys = new ArrayList<Long>();

        final List<Long> sortedDataSet = sortedDataSource.fetch(jsonRequest, userEntityId);

        // The pass.
        int pass = 1;
        int batchSize = 0;

        do
        {
            allKeys.clear();

            // multiply the batch size by the multiplier to avoid extra cache
            // hits
            batchSize = maxResults * (int) (Math.pow(2, pass));

            jsonRequest.put("count", batchSize + 1);

            final List<Long> descendingOrderDataSet = descendingOrderdataSource.fetch(jsonRequest, userEntityId);

            if (descendingOrderDataSet != null && sortedDataSet != null)
            {
                // we have both lists
                allKeys = andCollider.collide(descendingOrderDataSet, sortedDataSet, batchSize + 1);
            }
            else if (descendingOrderDataSet != null)
            {
                allKeys = descendingOrderDataSet;
            }
            else if (sortedDataSet != null)
            {
                allKeys = sortedDataSet;
            }

            // build a list of activity ids to fetch for this page, and
            // increment the start index for next page
            List<Long> page = new ArrayList<Long>();

            // loop across the available keys in allKeys
            for (int i = startingIndex; i < allKeys.size(); i++, startingIndex++)
            {
                // if this is within our limits, include it for security trimming
                if (allKeys.get(i) < maxActivityId && allKeys.get(i) > minActivityId)
                {
                    page.add(allKeys.get(i));

                    if (page.size() == batchSize || i == allKeys.size() - 1)
                    {
                        log.debug("Sending a page of " + page.size() + " out for security trimming.");

                        // we've filled up a page - either by hitting our batch size or by hitting the end of allKeys,
                        // so security trim it
                        page = securityTrimmer.trim(page, userEntityId);

                        // add the trimmed results to our return list
                        for (Long item : page)
                        {
                            results.add(item);
                            if (results.size() >= maxResults)
                            {
                                log.debug("Filled a full page of " + results.size() + " results.");
                                return results;
                            }
                        }

                        log.info("Return results now has " + results.size() + " results - looking for more");

                        // start over for our next scoped page
                        page.clear();
                    }
                }
            }

            // we've looped across allPages and haven't yet found enough results - increment the pass, and try
            // getting more into allKeys

            pass++;

            log.trace("Done looping?: " + (allKeys.size() <= batchSize) + ", pass: " + pass + ", results.size(): "
                    + results.size() + ", maxResults: " + maxResults + ", allKeys.size(): " + allKeys.size()
                    + ", batchSize: " + batchSize);
        }
        while (allKeys.size() > batchSize);

        return results;
    }
}
