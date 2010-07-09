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

import java.io.IOException;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;

import javax.mail.BodyPart;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.internet.MimeMessage.RecipientType;

import org.apache.commons.lang.StringUtils;
import org.eurekastreams.server.domain.HasEmail;

//TODO would be cool to turn this into a real message factory and create an email impl.
/**
 * Email helper for sending Emails.
 */
public class EmailerFactory
{
    /** Protocol message is using (e.g. "smtp"). */
    private String mailTransportProtocol;

    /**
     * List of configuration properties relevant to the given transport protocol. (For SMTP use mail.smtp.host and
     * mail.smtp.port)
     */
    private Map<String, String> transportConfiguration;

    /** Address of sender if not otherwise specified. */
    private String defaultFromAddress;

    /**
     * Constructor.
     *
     * @param inMailTransportProtocol
     *            Protocol message is using (e.g. "smtp").
     * @param inTransportConfiguration
     *            List of configuration properties relevant to the given transport protocol.
     * @param inDefaultFromAddress
     *            Address of sender if not otherwise specified.
     */
    public EmailerFactory(final String inMailTransportProtocol, final Map<String, String> inTransportConfiguration,
            final String inDefaultFromAddress)
    {
        mailTransportProtocol = inMailTransportProtocol;
        transportConfiguration = inTransportConfiguration;
        defaultFromAddress = inDefaultFromAddress;
    }

    /**
     * Convenience routine to create a string containing a list of emails from a list of people objects.
     *
     * @param list
     *            List of objects which have an email property.
     * @return String of concatenated email addresses ready to pass to setTo/setCc/setBcc.
     */
    public static String buildEmailList(final Iterable<? extends HasEmail> list)
    {
        Iterator<String> iter = new Iterator<String>()
        {
            Iterator<? extends HasEmail> innerIterator = list.iterator();

            @Override
            public boolean hasNext()
            {
                return innerIterator.hasNext();
            }

            @Override
            public String next()
            {
                return innerIterator.next().getEmail();
            }

            @Override
            public void remove()
            {
                // Not used
            }
        };
        return StringUtils.join(iter, ',');
    }

    /**
     * @param message
     *            message to be sent.
     * @throws MessagingException
     *             Thrown if there are problems sending the message.
     */
    public void sendMail(final MimeMessage message) throws MessagingException
    {
        Transport.send(message);
    }

    /**
     * Creates a "blank" email message, ready for the application to set the content (subject, body, etc.).
     *
     * @return An email message.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public MimeMessage createMessage() throws MessagingException
    {
        Properties mailProps = new Properties();
        mailProps.put("mail.transport.protocol", mailTransportProtocol);
        for (Map.Entry<String, String> cfg : transportConfiguration.entrySet())
        {
            mailProps.put(cfg.getKey(), cfg.getValue());
        }
        Session mailSession = Session.getInstance(mailProps, null);

        MimeMessage msg = new MimeMessage(mailSession);
        msg.setContent(new MimeMultipart("alternative"));
        msg.setSentDate(new Date());
        msg.setFrom(new InternetAddress(defaultFromAddress));

        return msg;
    }

    /**
     * Sets the primary ('to') recipients.
     *
     * @param message
     *            Email message being built.
     * @param emailToString
     *            Comma delimited list of email addresses Email is being sent to.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setTo(final MimeMessage message, final String emailToString) throws MessagingException
    {
        message.setRecipients(RecipientType.TO, emailToString);
    }

    /**
     * Sets the CC recipients.
     *
     * @param message
     *            Email message being built.
     * @param emailToString
     *            Comma delimited list of email addresses Email is being sent to.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setCc(final MimeMessage message, final String emailToString) throws MessagingException
    {
        message.setRecipients(RecipientType.CC, emailToString);
    }

    /**
     * Sets the BCC recipients.
     *
     * @param message
     *            Email message being built.
     * @param emailToString
     *            Comma delimited list of email addresses Email is being sent to.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setBcc(final MimeMessage message, final String emailToString) throws MessagingException
    {
        message.setRecipients(RecipientType.BCC, emailToString);
    }

    /**
     * @param message
     *            Email message being built.
     * @param emailFromString
     *            Email Address of person sending the email.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setFrom(final MimeMessage message, final String emailFromString) throws MessagingException
    {
        InternetAddress fromAddress = new InternetAddress(emailFromString);
        message.setFrom(fromAddress);
    }

    /**
     * @param message
     *            Email message being built.
     * @param subject
     *            Subject of the Email.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setSubject(final MimeMessage message, final String subject) throws MessagingException
    {
        message.setSubject(subject);
    }

    /**
     * @param message
     *            Email message being built.
     * @param textBody
     *            Plain Text Email Body.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setTextBody(final MimeMessage message, final String textBody) throws MessagingException
    {
        BodyPart textBp = new MimeBodyPart();
        textBp.setText(textBody);
        getMultipart(message).addBodyPart(textBp);
    }

    /**
     * @param message
     *            Email message being built.
     * @param htmlBody
     *            Rich HTML body of the Email.
     * @throws MessagingException
     *             Thrown if there are problems creating the message.
     */
    public void setHtmlBody(final MimeMessage message, final String htmlBody) throws MessagingException
    {
        BodyPart htmlBp = new MimeBodyPart();
        htmlBp.setContent(htmlBody, "text/html");
        htmlBp.setHeader("MIME-VERSION", "1.0");
        htmlBp.setHeader("Content-Type", "text/html; charset=ISO-8859-1");
        getMultipart(message).addBodyPart(htmlBp);
    }

    /**
     * Retrieves the multipart object from the message.
     *
     * @param message
     *            Email message being built.
     * @return multipart object.
     * @throws MessagingException
     *             If there is a problem retrieving the content.
     */
    protected Multipart getMultipart(final MimeMessage message) throws MessagingException
    {
        try
        {
            return (Multipart) message.getContent();
        }
        catch (IOException ex)
        {
            throw new MessagingException("Failed to retrieve multipart from message being built.", ex);
        }
    }
}
