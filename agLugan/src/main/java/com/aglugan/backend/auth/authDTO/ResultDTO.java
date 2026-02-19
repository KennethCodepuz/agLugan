package com.aglugan.backend.auth.authDTO;

import com.aglugan.backend.entity.Driver;
import com.aglugan.backend.entity.User;

public class ResultDTO {

    private final GoogleUserDTO googleUser;
    private final String errorMessage;
    private final User user;
    private final Driver driver;

    private ResultDTO(GoogleUserDTO googleUser, String errorMessage, User user, Driver driver) {
        this.googleUser = googleUser;
        this.errorMessage = errorMessage;
        this.user = user;
        this.driver = driver;
    }

    public static ResultDTO userSuccess(User user) {
        return new ResultDTO(null, null, user, null);
    }

    public static ResultDTO errorMessage(String errorMessage) {
        return new ResultDTO(null, errorMessage, null, null);
    }

    public static ResultDTO googleUserSuccess(GoogleUserDTO googleUser) {
        return new ResultDTO(googleUser, null, null, null);
    }

    public static ResultDTO driverUserSuccess(Driver driver) {
        return new ResultDTO(null, null, null, driver);
    }

    public User getUser() { return user; }
    public GoogleUserDTO getGoogleUser() { return googleUser; }
    public String getErrorMessage() { return errorMessage; }
    public Driver getDriver() { return driver; }

    public boolean isUserSuccess() {
        return user != null;
    }
    public boolean isGoogleUserSuccess() {
        return googleUser != null;
    }
    public boolean isDriverSuccess() { return driver != null; }
}
