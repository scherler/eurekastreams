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
package org.eurekastreams.web.client.ui.common.stream.share;

import java.util.HashMap;

import org.eurekastreams.commons.client.ActionProcessor;
import org.eurekastreams.commons.client.ActionRequestImpl;
import org.eurekastreams.commons.client.ui.WidgetCommand;
import org.eurekastreams.server.action.request.stream.PostActivityRequest;
import org.eurekastreams.server.domain.EntityType;
import org.eurekastreams.server.domain.stream.ActivityDTO;
import org.eurekastreams.server.domain.stream.StreamScope;
import org.eurekastreams.server.domain.stream.StreamScope.ScopeType;
import org.eurekastreams.web.client.events.EventBus;
import org.eurekastreams.web.client.events.Observer;
import org.eurekastreams.web.client.events.StreamReinitializeRequestEvent;
import org.eurekastreams.web.client.events.data.GotSystemSettingsResponseEvent;
import org.eurekastreams.web.client.model.SystemSettingsModel;
import org.eurekastreams.web.client.ui.Session;
import org.eurekastreams.web.client.ui.common.dialog.DialogContent;
import org.eurekastreams.web.client.ui.common.stream.PostToPanel;
import org.eurekastreams.web.client.ui.common.stream.decorators.ActivityDTOPopulator;
import org.eurekastreams.web.client.ui.common.stream.decorators.verb.SharePopulator;
import org.eurekastreams.web.client.ui.common.stream.renderers.StreamMessageItemRenderer;
import org.eurekastreams.web.client.ui.common.stream.renderers.StreamMessageItemRenderer.State;

import com.google.gwt.event.dom.client.ChangeEvent;
import com.google.gwt.event.dom.client.ChangeHandler;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.KeyUpEvent;
import com.google.gwt.event.dom.client.KeyUpHandler;
import com.google.gwt.user.client.Command;
import com.google.gwt.user.client.DeferredCommand;
import com.google.gwt.user.client.History;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.Hyperlink;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.TextArea;
import com.google.gwt.user.client.ui.Widget;

/**
 * The dialog content for sharing.
 * 
 */
public class ShareMessageDialogContent implements DialogContent
{
    /**
     * The command to close the dialog.
     */
    private WidgetCommand closeCommand = null;

    /**
     * Main flow panel.
     */
    private FlowPanel body = new FlowPanel();
    /**
     * The processor.
     */
    private ActionProcessor processor;

    /**
     * The message box.
     */
    private TextArea commentBox = new TextArea();

    /**
     * The post to panel.
     */
    private PostToPanel postToPanel;
    
    /**
     * Error message.
     */
    Label errorMsg = new Label();

    /**
     * Max length.
     */
    private static final int MAXLENGTH = 250;

    /**
     * Action keys associated with recipient types.
     */
    private HashMap<EntityType, String> actionKeys = new HashMap<EntityType, String>();

    /** The count down label. */
    private Label countDown = new Label();

    /** Button to share content. */
    private Hyperlink share;

    /** If share button is inactive. */
    private boolean inactive = false;

    /**
     * Default constructor.
     * 
     * @param sharedMessage
     *            the shared message.
     */
    public ShareMessageDialogContent(final ActivityDTO sharedMessage)
    {
        StreamScope postScope = new StreamScope(ScopeType.PERSON, Session.getInstance().getCurrentPerson()
                .getAccountId());
        processor = Session.getInstance().getActionProcessor();

        actionKeys.put(EntityType.GROUP, "postGroupActivityServiceActionTaskHandler");
        actionKeys.put(EntityType.PERSON, "postPersonActivityServiceActionTaskHandler");

        body.addStyleName("share-message-dialog-body");

        Label loading = new Label("Share this activity to your stream or another stream");
        loading.setStyleName("form-title");
        body.add(loading);
        
        errorMsg.addStyleName("form-error-box");
        errorMsg.setVisible(false);
        body.add(errorMsg);
        
        postToPanel = new PostToPanel(postScope, true);
        body.add(postToPanel);

        StreamMessageItemRenderer messageRenderer = new StreamMessageItemRenderer(false, State.READONLY);

        body.add(messageRenderer.render(sharedMessage));

        Label messageLabel = new Label("Comment:");
        messageLabel.addStyleName("form-label");
        messageLabel.addStyleName("message-label");
        body.add(messageLabel);
        commentBox.addStyleName("message-box");
        body.add(commentBox);

        countDown.setText(Integer.toString(MAXLENGTH));
        countDown.addStyleName("characters-remaining");
        body.add(countDown);

        final Label warning = new Label();
        warning.addStyleName("warning");
        body.add(warning);
        Session.getInstance().getEventBus().addObserver(GotSystemSettingsResponseEvent.class,
                new Observer<GotSystemSettingsResponseEvent>()
                {
                    public void update(final GotSystemSettingsResponseEvent event)
                    {
                        warning.setText(event.getResponse().getContentWarningText());
                    }

                });
        SystemSettingsModel.getInstance().fetch(null, true);

        share = new Hyperlink("share", History.getToken());
        share.addStyleName("form-button");
        share.addStyleName("form-share-button");

        Hyperlink cancel = new Hyperlink("Cancel", History.getToken());
        cancel.addStyleName("form-button");
        cancel.addStyleName("form-cancel-button");
        cancel.addStyleName("share-message-cancel");

        body.add(share);
        body.add(cancel);

        cancel.addClickHandler(new ClickHandler()
        {
            public void onClick(final ClickEvent event)
            {
                close();
            }

        });

        commentBox.addKeyUpHandler(new KeyUpHandler()
        {
            public void onKeyUp(final KeyUpEvent event)
            {
                onCommentChanges();
            }
        });

        commentBox.addChangeHandler(new ChangeHandler()
        {
            public void onChange(final ChangeEvent event)
            {
                onCommentChanges();
            }
        });

        share.addClickHandler(new ClickHandler()
        {
            public void onClick(final ClickEvent event)
            {
                if (!inactive)
                {
                    StreamScope scope = postToPanel.getPostScope();

                    if (scope != null)
                    {
                        hideError();
                        EntityType recipientType;
                        if (scope.getScopeType().equals(ScopeType.PERSON))
                        {
                            recipientType = EntityType.PERSON;
                        }
                        else
                        {
                            recipientType = EntityType.GROUP;
                        }
    
                        PostActivityRequest postRequest = new PostActivityRequest(new ActivityDTOPopulator()
                                .getActivityDTO("", recipientType, scope.getUniqueKey(),
                                        new SharePopulator(sharedMessage, commentBox.getText()), null));
    
                        processor.makeRequest(new ActionRequestImpl<Integer>(actionKeys.get(recipientType),
                                postRequest), new AsyncCallback<ActivityDTO>()
                                {
                                    /* implement the async call back methods */
                                    public void onFailure(final Throwable caught)
                                    {
                                        // TODO handle error.
                                    }
    
                                    public void onSuccess(final ActivityDTO result)
                                    {
                                        close();
                                        EventBus.getInstance().notifyObservers(
                                                StreamReinitializeRequestEvent.getEvent());
                                    }
                                });
                    }
                    else
                    {
                        showError("The stream name you entered could not be found");
                    }
                }
            }
        });
    }

    /**
     * Shows the error.
     * @param text the error message text.
     */
    private void showError(final String text)
    {
        errorMsg.setText(text);
        errorMsg.setVisible(true);
    }
    
    /**
     * Hides the error.
     */
    private void hideError()
    {
        errorMsg.setVisible(false);
    }
    
    /**
     * The command to call to close the dialog.
     * 
     * @param command
     *            the close command.
     */
    public void setCloseCommand(final WidgetCommand command)
    {
        closeCommand = command;
    }

    /**
     * Call the close command.
     */
    public void close()
    {
        closeCommand.execute();
    }

    /**
     * Gets the body panel.
     * 
     * @return the body.
     */
    public Widget getBody()
    {
        return body;
    }

    /**
     * Gets the CSS name.
     * 
     * @return the class.
     */
    public String getCssName()
    {
        return "share-message-dialog";
    }

    /**
     * Gets the title.
     * 
     * @return the title.
     */
    public String getTitle()
    {
        return "Share";
    }

    /**
     * On show, set focus to comment box.
     */
    public void show()
    {
        DeferredCommand.addCommand(new Command()
        {
            public void execute()
            {
                commentBox.setFocus(true);
            }
        });
    }

    /**
     * Gets triggered whenever the comment changes.
     */
    private void onCommentChanges()
    {
        Integer charsRemaining = MAXLENGTH - commentBox.getText().length();
        countDown.setText(charsRemaining.toString());
        if (charsRemaining >= 0)
        {
            countDown.removeStyleName("over-character-limit");
            share.removeStyleName("inactive");
            inactive = false;
        }
        else
        {
            countDown.addStyleName("over-character-limit");
            share.addStyleName("inactive");
            inactive = true;
        }
    }
}
