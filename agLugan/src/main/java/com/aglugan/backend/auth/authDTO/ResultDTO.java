package com.aglugan.backend.auth.authDTO;

import com.aglugan.backend.entity.User;

import javax.xml.transform.Result;

public class ResultDTO {

    private final GoogleUserDTO googleUser;
    private final String errorMessage;
    private final User user;

    private ResultDTO(GoogleUserDTO googleUser, String errorMessage, User user) {
        this.googleUser = googleUser;
        this.errorMessage = errorMessage;
        this.user = user;
    }

    public static ResultDTO userSuccess(User user) {
        return new ResultDTO(null, null, user);
    }

    public static ResultDTO errorMessage(String errorMessage) {
        return new ResultDTO(null, errorMessage, null);
    }

    public static ResultDTO googleUserSuccess(GoogleUserDTO googleUser) {
        return new ResultDTO(googleUser, null, null);
    }

    public User getUser() { return user; }
    public GoogleUserDTO getGoogleUser() { return googleUser; }
    public String getErrorMessage() { return errorMessage; }

    public boolean isUserSuccess() {
        return user != null;
    }
    public boolean isGoogleUserSuccess() {
        return user != null;
    }
}
