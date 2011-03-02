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
package org.eurekastreams.web.client.ui.pages.profile;

import org.eurekastreams.commons.client.ActionProcessor;
import org.eurekastreams.server.action.request.profile.GetFollowersFollowingRequest;
import org.eurekastreams.server.domain.EntityType;
import org.eurekastreams.server.domain.Page;
import org.eurekastreams.server.domain.stream.StreamScope;
import org.eurekastreams.server.domain.stream.StreamScope.ScopeType;
import org.eurekastreams.server.search.modelview.PersonModelView;
import org.eurekastreams.web.client.events.EventBus;
import org.eurekastreams.web.client.events.Observer;
import org.eurekastreams.web.client.events.SetBannerEvent;
import org.eurekastreams.web.client.events.StreamRequestEvent;
import org.eurekastreams.web.client.events.data.BaseDataResponseEvent;
import org.eurekastreams.web.client.events.data.DeletedPersonFollowersResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonFollowersResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonFollowingResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonJoinedGroupsResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonalBiographyResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonalEducationResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonalEmploymentResponseEvent;
import org.eurekastreams.web.client.events.data.GotPersonalInformationResponseEvent;
import org.eurekastreams.web.client.events.data.InsertedPersonFollowerResponseEvent;
import org.eurekastreams.web.client.history.CreateUrlRequest;
import org.eurekastreams.web.client.model.AllPopularHashTagsModel;
import org.eurekastreams.web.client.model.OrganizationModel;
import org.eurekastreams.web.client.model.PersonFollowersModel;
import org.eurekastreams.web.client.model.PersonFollowingModel;
import org.eurekastreams.web.client.model.PersonJoinedGroupsModel;
import org.eurekastreams.web.client.model.PersonalBiographyModel;
import org.eurekastreams.web.client.model.PersonalEducationModel;
import org.eurekastreams.web.client.model.PersonalEmploymentModel;
import org.eurekastreams.web.client.model.PersonalInformationModel;
import org.eurekastreams.web.client.ui.Session;
import org.eurekastreams.web.client.ui.common.LeftBarPanel;
import org.eurekastreams.web.client.ui.common.pagedlist.GroupRenderer;
import org.eurekastreams.web.client.ui.common.pagedlist.PagedListPanel;
import org.eurekastreams.web.client.ui.common.pagedlist.PersonRenderer;
import org.eurekastreams.web.client.ui.common.stream.StreamJsonRequestFactory;
import org.eurekastreams.web.client.ui.common.stream.StreamPanel;
import org.eurekastreams.web.client.ui.common.tabs.SimpleTab;
import org.eurekastreams.web.client.ui.common.tabs.TabContainerPanel;
import org.eurekastreams.web.client.ui.pages.profile.tabs.PersonalProfileAboutTabPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.AboutPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.BreadcrumbPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.ChecklistProgressBarPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.ConnectionsPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.ContactInfoPanel;
import org.eurekastreams.web.client.ui.pages.profile.widgets.PopularHashtagsPanel;

import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.Hyperlink;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.Panel;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.SimplePanel;

/**
 * Displays a summary of a person's profile.
 */
public class PersonalProfilePanel extends FlowPanel
{
    /**
     * Spacing panel -- we use floats in on the ProfilePage, so make sure nothing below it intrudes.
     */
    SimplePanel clearPanel = new SimplePanel();

    /**
     * About panel.
     */
    private final AboutPanel about;

    /**
     * Gets current user in session.
     */
    private final PersonModelView currentUser = Session.getInstance().getCurrentPerson();
    /**
     * Holds the PortalPage section of the profile display.
     */
    private TabContainerPanel portalPage = null;

    /**
     * Panel that shows the bread crumb navigation.
     */
    private final BreadcrumbPanel breadCrumbPanel;

    /**
     * Link to go to the profile settings page.
     */
    private final Hyperlink profileSettingsLink;

    /**
     * Panel that holds the tabbed portion of the profile display.
     */
    private final FlowPanel portalPageContainer = new FlowPanel();

    /**
     * Left bar container.
     */
    private final FlowPanel leftBarContainer = new FlowPanel();
    /**
     * panel that holds the profile summary.
     */
    private final LeftBarPanel leftBarPanel = new LeftBarPanel();

    /**
     * The person whose profile we're looking at.
     */
    private PersonModelView personModelView;

    /**
     * Followers.
     */
    private int followers;

    /**
     * The panel that shows the checklist.
     */
    private final ChecklistProgressBarPanel checklistPanel = new ChecklistProgressBarPanel(
            "Employee Profile Checklist",
            "Completing your profile is easy: upload your picture, enter your contact information, "
                    + "and add some work and personal related information. Employees that fill "
                    + "out their profile are more likely to be found by others across your organization.",
            new CreateUrlRequest(Page.PERSONAL_SETTINGS, Session.getInstance().getCurrentPerson().getAccountId()));

    /**
     * The divider separating the checklistPanel from the rest of the left-bar content.
     */
    private final FlowPanel checklistDivider = new FlowPanel();

    /**
     * Connections Panel Holds the Small boxes with the connect counts.
     */
    private ConnectionsPanel connectionsPanel;

    /**
     * Constructor.
     * 
     * @param accountId
     *            the account id.
     */
    public PersonalProfilePanel(final String accountId)
    {
        profileSettingsLink = new Hyperlink("Configure", Session.getInstance().generateUrl(
                new CreateUrlRequest(Page.PERSONAL_SETTINGS, accountId)));
        RootPanel.get().addStyleName("profile");

        ActionProcessor inProcessor = Session.getInstance().getActionProcessor();
        about = new AboutPanel(accountId);
        portalPageContainer.addStyleName("profile-page-container");
        profileSettingsLink.addStyleName("configure-tab");
        profileSettingsLink.addStyleName("hidden");
        leftBarContainer.addStyleName("left-bar-container");
        breadCrumbPanel = new BreadcrumbPanel(inProcessor);

        this.add(breadCrumbPanel);
        this.add(profileSettingsLink);
        leftBarContainer.add(leftBarPanel);
        this.add(leftBarContainer);
        this.add(portalPageContainer);
        this.add(clearPanel);

        this.addStyleName("profile-page");

        EventBus.getInstance().addObserver(GotPersonalInformationResponseEvent.class,
                new Observer<GotPersonalInformationResponseEvent>()
                {
                    public void update(final GotPersonalInformationResponseEvent event)
                    {
                        // Note: Must remove observer BEFORE building the widgets. The personal about tab widget makes
                        // the same request to the model as is being processed here. Unless the observer is unwired
                        // first, it will be called a second time.
                        EventBus.getInstance().removeObserver(GotPersonalInformationResponseEvent.class, this);
                        setEntity(event.getResponse());
                    }
                });

        inProcessor.setQueueRequests(true);
        PersonalInformationModel.getInstance().fetch(accountId, false);
        AllPopularHashTagsModel.getInstance().fetch(null, true);
        inProcessor.fireQueuedRequests();

    }

    /**
     * We have the Person, so set up the Profile summary.
     * 
     * @param inPerson
     *            the person whose profile is being displayed
     */
    public void setEntity(final PersonModelView inPerson)
    {
        ActionProcessor inProcessor = Session.getInstance().getActionProcessor();
        inProcessor.setQueueRequests(true);

        if (inPerson == null)
        {
            showInvalidPersonMessage();
        }
        personModelView = inPerson;

        leftBarPanel.clear();
        portalPageContainer.clear();

        // Set the banner.
        Session.getInstance().getEventBus().notifyObservers(new SetBannerEvent(inPerson));

        if (personModelView.getAccountId().equals(Session.getInstance().getCurrentPerson().getAccountId()))
        {
            profileSettingsLink.removeStyleName("hidden");
            RootPanel.get().addStyleName("authenticated");
        }

        breadCrumbPanel.setPerson(personModelView);

        followers = personModelView.getFollowersCount();

        // Update the Profile summary
        about.setPerson(personModelView);
        connectionsPanel = new ConnectionsPanel();
        connectionsPanel.addConnection("Followers", null, personModelView.getFollowersCount());
        connectionsPanel.addConnection("Following", null, personModelView.getFollowingCount(), "center");
        connectionsPanel.addConnection("Groups", null, personModelView.getGroupsCount());

        Session.getInstance().getEventBus().addObserver(InsertedPersonFollowerResponseEvent.class,
                new Observer<InsertedPersonFollowerResponseEvent>()
                {
                    public void update(final InsertedPersonFollowerResponseEvent event)
                    {
                        followers++;
                        connectionsPanel.updateCount("Followers", followers);
                    }
                });

        Session.getInstance().getEventBus().addObserver(DeletedPersonFollowersResponseEvent.class,
                new Observer<DeletedPersonFollowersResponseEvent>()
                {
                    public void update(final DeletedPersonFollowersResponseEvent event)
                    {
                        followers--;
                        connectionsPanel.updateCount("Followers", followers);
                    }
                });

        // Make the Connections Tab
        final PagedListPanel connectionTabContent = createConnectionsTabContent(personModelView);

        // update the list of members after joining/leaving the group
        Observer<BaseDataResponseEvent<Integer>> followChangeObserver = new Observer<BaseDataResponseEvent<Integer>>()
        {
            @SuppressWarnings("unchecked")
            public void update(final BaseDataResponseEvent ev)
            {
                if ("Followers".equals(connectionTabContent.getCurrentFilter()))
                {
                    connectionTabContent.refreshData();
                }
            }
        };
        Session.getInstance().getEventBus()
                .addObserver(InsertedPersonFollowerResponseEvent.class, followChangeObserver);
        Session.getInstance().getEventBus()
                .addObserver(DeletedPersonFollowersResponseEvent.class, followChangeObserver);

        leftBarPanel.addChildWidget(about);
        leftBarPanel.addChildWidget(new PopularHashtagsPanel(ScopeType.PERSON, personModelView.getAccountId()));
        leftBarPanel.addChildWidget(connectionsPanel);
        leftBarPanel.addChildWidget(new ContactInfoPanel(personModelView));

        if (personModelView.getAccountId().equals(Session.getInstance().getCurrentPerson().getAccountId()))
        {
            setUpChecklist();
        }

        final StreamPanel streamContent = new StreamPanel(false);
        streamContent.setStreamScope(new StreamScope(ScopeType.PERSON, personModelView.getAccountId(), personModelView
                .getStreamId()), (personModelView.isStreamPostable() || (currentUser.getAccountId() == personModelView
                .getAccountId())));

        if (personModelView.isAccountLocked())
        {
            streamContent.setLockedMessagePanel(generateLockedUserMessage());
        }

        String jsonRequest = StreamJsonRequestFactory.addRecipient(EntityType.PERSON, personModelView.getAccountId(),
                StreamJsonRequestFactory.getEmptyRequest()).toString();

        EventBus.getInstance().notifyObservers(new StreamRequestEvent(personModelView.getDisplayName(), jsonRequest));

        portalPage = new TabContainerPanel();

        portalPage.addTab(new SimpleTab("Stream", streamContent));
        portalPage.addTab(new SimpleTab("Connections", connectionTabContent));
        portalPage.addTab(new SimpleTab("About", new PersonalProfileAboutTabPanel(personModelView)));
        portalPage.init();

        portalPage.setStyleName("profile-gadgets-container");

        portalPageContainer.add(portalPage);

        inProcessor.setQueueRequests(false);
        inProcessor.fireQueuedRequests();
    }

    /**
     * Generates a panel to use as the message when a user is locked out of the system.
     * 
     * @return the Panel content containing the locked message.
     */
    private Panel generateLockedUserMessage()
    {
        Panel errorReport = new FlowPanel();
        errorReport.addStyleName("error-report");

        FlowPanel centeringPanel = new FlowPanel();
        centeringPanel.addStyleName("error-report-container");
        centeringPanel.add(errorReport);
        add(centeringPanel);

        FlowPanel msgPanel = new FlowPanel();

        Label msgHeader = new Label("Employee no longer has access to Eureka Streams");
        msgHeader.addStyleName("error-message");

        Label msgText = new Label("This employee no longer has access to Eureka Streams. This could be due to a change"
                + " of assignment within the company or due to leaving the company.");
        FlowPanel text = new FlowPanel();
        text.add(msgText);
        text.addStyleName("error-message-text");

        msgPanel.add(msgHeader);
        msgPanel.add(msgText);

        errorReport.add(msgPanel);
        return errorReport;
    }

    /**
     * Tell the user that the person does not exist.
     */
    private void showInvalidPersonMessage()
    {
        OrganizationModel.getInstance().fetch("", true);

        clear();
        Panel errorReport = addNewCenteredErrorBox();

        FlowPanel msgPanel = new FlowPanel();

        Label msgHeader = new Label("Profile not found");
        msgHeader.addStyleName("warning-message");

        Hyperlink directoryLink = new Hyperlink("profiles", Session.getInstance().generateUrl(
                new CreateUrlRequest(Page.ORGANIZATIONS, "")));
        Label msgText1 = new Label("The person you were looking for could not be found. Try browsing the  ");
        Label msgText2 = new Label(
                " or searching the profiles by entering the name in the \"search profiles\" box above.");

        FlowPanel msgText = new FlowPanel();
        msgText.add(msgText1);
        msgText.add(directoryLink);
        msgText.add(msgText2);
        msgText.addStyleName("error-message-text");
        msgPanel.add(msgHeader);
        msgPanel.add(msgText);
        errorReport.add(msgPanel);
    }

    /**
     * Creates a new error report box and centers it on the page.
     * 
     * @return The error report box, ready to have content added to it.
     */
    private Panel addNewCenteredErrorBox()
    {
        // create panel
        Panel errorReport = new FlowPanel();
        errorReport.addStyleName("warning-report");

        // center on page
        FlowPanel centeringPanel = new FlowPanel();
        centeringPanel.addStyleName("warning-report-container");
        centeringPanel.add(errorReport);
        add(centeringPanel);

        return errorReport;
    }

    /**
     * Set up the checklist.
     */
    private void setUpChecklist()
    {
        checklistDivider.addStyleName("left-bar-child-divider");
        leftBarPanel.add(checklistDivider);
        leftBarPanel.add(checklistPanel);

        checklistPanel.addTask(new Task("Basic Information",
                "Upload your picture, share a list of your skills and interests, provide a description of what you "
                        + "do, and add your contact information."), personModelView.getAvatarId() != null
                && personModelView.getJobDescription() != null && personModelView.getInterests() != null
                && personModelView.getInterests().size() > 0);

        final Task biographyTask = new Task("Biography", "Provide an overview of your professional background.",
                "Work History & Education");
        checklistPanel.addTask(biographyTask, false);

        final Task workHistoryTask = new Task("Work History",
                "List your past work experiences and related skills and achievements.", "Work History & Education");
        checklistPanel.addTask(workHistoryTask, false);

        final Task educationTask = new Task("Education",
                "List the schools you have attended and degrees you have earned.", "Work History & Education");
        checklistPanel.addTask(educationTask, false);

        Session.getInstance().getEventBus().addObserver(GotPersonalBiographyResponseEvent.class,
                new Observer<GotPersonalBiographyResponseEvent>()
                {
                    public void update(final GotPersonalBiographyResponseEvent event)
                    {
                        if (event.getResponse() != null && !event.getResponse().equals(""))
                        {
                            checklistPanel.setTaskComplete(biographyTask);
                        }
                    }
                });

        Session.getInstance().getEventBus().addObserver(GotPersonalEducationResponseEvent.class,
                new Observer<GotPersonalEducationResponseEvent>()
                {
                    public void update(final GotPersonalEducationResponseEvent event)
                    {
                        if (event.getResponse().size() > 0)
                        {
                            checklistPanel.setTaskComplete(educationTask);
                        }
                    }
                });

        Session.getInstance().getEventBus().addObserver(GotPersonalEmploymentResponseEvent.class,
                new Observer<GotPersonalEmploymentResponseEvent>()
                {
                    public void update(final GotPersonalEmploymentResponseEvent event)
                    {
                        if (event.getResponse().size() > 0)
                        {
                            checklistPanel.setTaskComplete(workHistoryTask);
                        }
                    }
                });

        Session.getInstance().getActionProcessor().setQueueRequests(true);
        PersonalBiographyModel.getInstance().fetch(personModelView.getAccountId(), true);
        PersonalEducationModel.getInstance().fetch(personModelView.getId(), true);
        PersonalEmploymentModel.getInstance().fetch(personModelView.getId(), true);
        Session.getInstance().getActionProcessor().setQueueRequests(false);
        Session.getInstance().getActionProcessor().fireQueuedRequests();
    }

    /**
     * Creates and sets up the connections tab content.
     * 
     * @param inPerson
     *            Person whose profile is being displayed.
     * @return Tab content.
     */
    private PagedListPanel createConnectionsTabContent(final PersonModelView inPerson)
    {
        final PagedListPanel connectionTabContent = new PagedListPanel("connections");

        Session.getInstance().getEventBus().addObserver(GotPersonFollowersResponseEvent.class,
                new Observer<GotPersonFollowersResponseEvent>()
                {
                    public void update(final GotPersonFollowersResponseEvent event)
                    {
                        connectionTabContent.render(event.getResponse(), "No one is following this person");
                    }
                });

        Session.getInstance().getEventBus().addObserver(GotPersonFollowingResponseEvent.class,
                new Observer<GotPersonFollowingResponseEvent>()
                {
                    public void update(final GotPersonFollowingResponseEvent event)
                    {
                        connectionTabContent.render(event.getResponse(), "This person is not following anyone");
                    }
                });

        Session.getInstance().getEventBus().addObserver(GotPersonJoinedGroupsResponseEvent.class,
                new Observer<GotPersonJoinedGroupsResponseEvent>()
                {
                    public void update(final GotPersonJoinedGroupsResponseEvent event)
                    {
                        connectionTabContent.render(event.getResponse(), "This person is not following any groups");
                    }
                });

        connectionTabContent.addSet("Followers", PersonFollowersModel.getInstance(), new PersonRenderer(false),
                new GetFollowersFollowingRequest(EntityType.PERSON, inPerson.getAccountId(), 0, 0));

        connectionTabContent.addSet("Following", PersonFollowingModel.getInstance(), new PersonRenderer(false),
                new GetFollowersFollowingRequest(EntityType.PERSON, inPerson.getAccountId(), 0, 0));

        connectionTabContent.addSet("Groups", PersonJoinedGroupsModel.getInstance(), new GroupRenderer(),
                new GetFollowersFollowingRequest(EntityType.GROUP, inPerson.getAccountId(), 0, 0));

        return connectionTabContent;
    }
}
