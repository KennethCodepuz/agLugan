package com.aglugan.backend.auth.googleAuth;

import com.aglugan.backend.auth.authDTO.GoogleUserDTO;
import com.aglugan.backend.auth.authDTO.ResultDTO;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Component()
public class GoogleTokenVerifier {

    @Value("${google.api.client.id}")
    private String clientID;

    private final NetHttpTransport transport = new NetHttpTransport();
    private final GsonFactory factory = new GsonFactory();

    public ResultDTO verifyGoogleToken(String token) {

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, factory)
                .setAudience(Collections.singletonList(clientID))
                .build();

        try {
            GoogleIdToken idToken = verifier.verify(token);
            System.out.println("Verification result: " + idToken);
            System.out.println(clientID);
            if(idToken == null) {
                throw new IOException("Invalid User");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            GoogleUserDTO user = new GoogleUserDTO(payload.getSubject(), (String) payload.get("name"), payload.getEmail(), (String) payload.get("picture"), null);
            ResultDTO result = new ResultDTO(user, null);
            return result;
        }catch (GeneralSecurityException | IOException e) {
            e.printStackTrace();
            ResultDTO result = new ResultDTO(null, e.getMessage());
            return result;
        }

    }
}
